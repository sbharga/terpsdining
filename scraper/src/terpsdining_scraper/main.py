"""Daily hours, menus, nutrition, and image collection."""

import argparse
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, date, datetime, timedelta

import httpx
from ddgs.exceptions import RatelimitException

from . import db
from .config import HALL_IDS, MEALS, SHEET_URL, TZ, USER_AGENT
from .hours import parse_sheet
from .images import fetch_and_store_image
from .label import parse_label
from .menu import fetch_menu, parse_menu

logger = logging.getLogger(__name__)


def _arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect UMD dining data")
    parser.add_argument(
        "--date",
        type=date.fromisoformat,
        default=os.environ.get("SCRAPE_DATE") or datetime.now(TZ).date().isoformat(),
        metavar="YYYY-MM-DD",
    )
    parser.add_argument(
        "--days", type=int, default=os.environ.get("SCRAPE_DAYS") or "1", metavar="N"
    )
    parser.add_argument("--image-limit", type=int, default=150)
    parser.add_argument("--skip-images", action="store_true")
    parser.add_argument("--skip-hours", action="store_true")
    return parser.parse_args()


def _fetch_nutrition(http: httpx.Client, label_url: str) -> dict:
    response = http.get(label_url)
    response.raise_for_status()
    return parse_label(response.text)


def main() -> int:
    args = _arguments()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    sb = db.client()
    counts = dict.fromkeys(("hours", "items", "offerings", "nutrition", "images", "failures"), 0)
    menu_failed = False

    with httpx.Client(
        headers={"User-Agent": USER_AGENT}, timeout=30, follow_redirects=True
    ) as http:
        if not args.skip_hours:
            halls = sb.table("halls").select("id,sheet_name").execute().data
            hall_ids_by_sheet_name = {hall["sheet_name"]: hall["id"] for hall in halls}
            response = http.get(SHEET_URL)
            response.raise_for_status()
            rows = parse_sheet(response.text, hall_ids_by_sheet_name)
            db.upsert_hours(rows)
            counts["hours"] = len(rows)

        items = {}
        slots = []
        for offset in range(args.days):
            day = args.date + timedelta(days=offset)
            for hall_id in HALL_IDS:
                for meal in MEALS:
                    try:
                        html = fetch_menu(http, hall_id, day, meal)
                    except httpx.HTTPError as exc:
                        logger.error(
                            "Menu fetch failed for %s hall %s %s: %s",
                            day.isoformat(), hall_id, meal, exc,
                        )
                        menu_failed = True
                        counts["failures"] += 1
                        continue

                    entries = parse_menu(html)
                    offerings = {}
                    for entry in entries:
                        item = items.setdefault(
                            entry.item_id,
                            {"id": entry.item_id, "allergens": set(), "dietary": set()},
                        )
                        item["name"] = entry.name
                        item["label_url"] = entry.label_url
                        item["allergens"].update(entry.allergens)
                        item["dietary"].update(entry.dietary)
                        offerings[(entry.item_id, entry.station)] = {
                            "item_id": entry.item_id,
                            "station": entry.station,
                            "portion": entry.portion,
                        }
                    # Only successfully fetched slots are buffered. An empty
                    # menu still has a slot, so its stale offerings are cleared.
                    slots.append((hall_id, day.isoformat(), meal, list(offerings.values())))

        item_rows = [
            {
                "id": item["id"],
                "name": item["name"],
                "label_url": item["label_url"],
                "allergens": sorted(item["allergens"]),
                "dietary": sorted(item["dietary"]),
            }
            for item in items.values()
        ]
        db.upsert_items(item_rows)
        counts["items"] = len(item_rows)
        for hall_id, day_iso, meal, offerings in slots:
            db.replace_offerings(hall_id, day_iso, meal, offerings)
            counts["offerings"] += len(offerings)

        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {
                executor.submit(_fetch_nutrition, http, item["label_url"]): item["id"]
                for item in db.items_needing_nutrition(1000)
            }
            for future in as_completed(futures):
                item_id = futures[future]
                try:
                    fields = future.result()
                except httpx.HTTPError as exc:
                    logger.warning("Label fetch failed for %s: %s", item_id, exc)
                    counts["failures"] += 1
                    continue
                fields["nutrition_checked_at"] = datetime.now(UTC).isoformat()
                db.update_item(item_id, fields)
                counts["nutrition"] += 1

        if not args.skip_images:
            for index, item in enumerate(db.items_needing_images(args.image_limit)):
                if index:
                    time.sleep(2)
                try:
                    path = fetch_and_store_image(http, sb, item["id"], item["name"])
                except RatelimitException:
                    print("ddgs rate limited; stopping image phase")
                    break
                fields = {"image_checked_at": datetime.now(UTC).isoformat()}
                if path is not None:
                    fields["image_path"] = path
                    counts["images"] += 1
                db.update_item(item["id"], fields)

    print(" ".join(f"{key}={value}" for key, value in counts.items()))
    return 1 if menu_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
