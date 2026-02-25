#!/usr/bin/env python3
"""
scripts/sync_menu.py

Daily sync for Terps Dining:
  Phase A - Fetch today's dining hours from the Google Sheet and upsert into `hours`.
  Phase B - Scrape nutrition.umd.edu for each (hall, meal period) and upsert into
            `foods` and `menus`.
  Cleanup  - Delete `menus` and `hours` rows older than 90 days (free-tier guardrail).

Required env vars:
  SUPABASE_URL              - e.g. https://xxxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY - service role key (bypasses RLS; keep secret)
"""

import json
import logging
import os
from datetime import date, timedelta
from itertools import product

import requests
from bs4 import BeautifulSoup
from supabase import Client, create_client

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

DINING_HALLS = [
    {"slug": "south",        "location_num": "16"},
    {"slug": "yahentamitsi", "location_num": "19"},
    {"slug": "251_north",    "location_num": "51"},
]

MEAL_PERIODS = ["Breakfast", "Lunch", "Dinner"]

GOOGLE_SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "1vdWskGO2-aJfKLSW8-3zMaj_nx4SBJHF3OvMEy4-ZNo"
    "/gviz/tq?gid=479022338"
)

# Maps Google Sheet venue names → dining hall slugs
VENUE_KEYS = {
    "South Campus": "south",
    "Yahentamitsi": "yahentamitsi",
    "251 North":    "251_north",
}

NUTRITION_URL = "http://nutrition.umd.edu/longmenu.aspx"
BATCH_SIZE = 100
CLEANUP_DAYS = 90

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------


def chunks(lst: list, n: int):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i : i + n]


# ---------------------------------------------------------------------------
# Scrapers / Fetchers
# ---------------------------------------------------------------------------


def fetch_dining_hours() -> dict[str, list[str]]:
    """
    Returns a dict mapping each hall slug to [breakfast, lunch, dinner] strings.
    """
    response = requests.get(GOOGLE_SHEET_URL, timeout=10)
    response.raise_for_status()

    # Google Viz API wraps JSON in a callback; strip the wrapper
    raw_json = response.text[47:-2]
    data = json.loads(raw_json)

    rows = [
        [cell["v"] if cell else "" for cell in row["c"]]
        for row in data["table"]["rows"]
    ]

    # Row 0 is the header; cells look like "2/25/2025 0:00:00"
    header = rows[0]
    today = date.today()
    today_str = f"{today.month}/{today.day}"

    col = next(
        (i for i, h in enumerate(header) if h and h.startswith(today_str)),
        None,
    )
    if col is None:
        raise ValueError(f"No column found for today ({today_str!r}) in Google Sheet")

    result: dict[str, list[str]] = {}
    for i in range(1, len(rows), 3):
        venue_raw = rows[i][0].split("|")[0].strip()
        slug = VENUE_KEYS.get(venue_raw)
        if slug is None:
            continue
        result[slug] = [
            rows[i][col]     or "Closed",
            rows[i + 1][col] or "Closed",
            rows[i + 2][col] or "Closed",
        ]
    return result


def scrape_menu(location_num: str, date_str: str, meal_period: str) -> list[dict]:
    """
    Scrapes nutrition.umd.edu and returns a list of
    {"name": str, "allergens": list[str]} dicts.

    date_str format: "M/D/YYYY" (no leading zeros).
    """
    response = requests.get(
        NUTRITION_URL,
        params={
            "locationNum": location_num,
            "dtdate": date_str,
            "mealName": meal_period,
        },
        timeout=15,
    )
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    items = []
    for row in soup.find_all("tr"):
        link = row.find("a", href=lambda h: h and "label.aspx" in h)
        if not link:
            continue
        name = link.get_text(strip=True)
        allergen_imgs = row.find_all("img", class_="nutri-icon")
        allergens = [
            img["alt"].removeprefix("Contains ").lower()
            for img in allergen_imgs
            if img.get("alt")
        ]
        items.append({"name": name, "allergens": allergens})
    return items


# ---------------------------------------------------------------------------
# Phase A – Hours
# ---------------------------------------------------------------------------


def sync_hours(supabase: Client, hall_ids: dict[str, str], today: date) -> None:
    log.info("Phase A: Syncing hours...")
    hours_data = fetch_dining_hours()

    records = []
    for slug, (breakfast, lunch, dinner) in hours_data.items():
        hall_id = hall_ids.get(slug)
        if hall_id is None:
            log.warning("  Unknown hall slug from sheet: %s", slug)
            continue
        records.append(
            {
                "date": today.isoformat(),
                "dining_hall_id": hall_id,
                "breakfast": breakfast,
                "lunch": lunch,
                "dinner": dinner,
            }
        )

    supabase.table("hours").upsert(
        records, on_conflict="date,dining_hall_id"
    ).execute()
    log.info("  Upserted %d hour row(s).", len(records))


# ---------------------------------------------------------------------------
# Phase B – Menus & Foods
# ---------------------------------------------------------------------------


def sync_menus(
    supabase: Client,
    hall_ids: dict[str, str],
    halls: list[dict],
    today: date,
) -> None:
    log.info("Phase B: Syncing menus & foods...")
    # nutrition.umd.edu expects M/D/YYYY (no leading zeros)
    today_str = f"{today.month}/{today.day}/{today.year}"

    for hall, period in product(halls, MEAL_PERIODS):
        slug = hall["slug"]
        hall_id = hall_ids.get(slug)
        if hall_id is None:
            log.warning("  Hall slug not found in DB: %s", slug)
            continue

        log.info("  Scraping %-15s %s...", slug, period)
        try:
            items = scrape_menu(hall["location_num"], today_str, period)
        except Exception as exc:
            log.error("  Scrape failed for %s %s: %s", slug, period, exc)
            continue

        if not items:
            log.info("  No items.")
            continue

        # Step 1: Upsert foods – update allergens on name conflict
        # Deduplicate by name; the scraper can return the same item multiple times
        seen: dict[str, dict] = {}
        for item in items:
            seen.setdefault(item["name"], {"name": item["name"], "allergens": item["allergens"]})
        food_records = list(seen.values())
        for batch in chunks(food_records, BATCH_SIZE):
            supabase.table("foods").upsert(batch, on_conflict="name").execute()

        # Step 2: Fetch the UUIDs that were just upserted
        names = [item["name"] for item in items]
        food_id_map: dict[str, str] = {}
        for batch in chunks(names, BATCH_SIZE):
            resp = (
                supabase.table("foods").select("id,name").in_("name", batch).execute()
            )
            for row in resp.data:
                food_id_map[row["name"]] = row["id"]

        # Step 3: Bulk insert menu rows – silently skip duplicates
        menu_records = [
            {
                "date": today.isoformat(),
                "meal_period": period,
                "dining_hall_id": hall_id,
                "food_id": food_id_map[item["name"]],
            }
            for item in items
            if item["name"] in food_id_map
        ]
        for batch in chunks(menu_records, BATCH_SIZE):
            supabase.table("menus").upsert(
                batch,
                on_conflict="date,meal_period,dining_hall_id,food_id",
                ignore_duplicates=True,
            ).execute()

        log.info("  Inserted %d menu row(s).", len(menu_records))


# ---------------------------------------------------------------------------
# Cleanup (free-tier guardrail)
# ---------------------------------------------------------------------------


def cleanup_old_data(supabase: Client, today: date) -> None:
    """Delete menus and hours older than CLEANUP_DAYS days."""
    cutoff = (today - timedelta(days=CLEANUP_DAYS)).isoformat()
    log.info("Cleanup: removing data before %s...", cutoff)
    supabase.table("menus").delete().lt("date", cutoff).execute()
    supabase.table("hours").delete().lt("date", cutoff).execute()
    log.info("Cleanup complete.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def main() -> None:
    today = date.today()
    log.info("Starting sync for %s", today.isoformat())

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # Load slug → UUID mapping from DB
    resp = supabase.table("dining_halls").select("id,slug").execute()
    hall_ids: dict[str, str] = {row["slug"]: row["id"] for row in resp.data}

    sync_hours(supabase, hall_ids, today)
    sync_menus(supabase, hall_ids, DINING_HALLS, today)
    cleanup_old_data(supabase, today)

    log.info("Sync complete.")


if __name__ == "__main__":
    main()
