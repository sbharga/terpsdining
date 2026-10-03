import json
import logging
import re
from datetime import datetime

from .config import MEALS, TZ

logger = logging.getLogger(__name__)
_TIME_RANGE = re.compile(
    r"^(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[-–]\s*"
    r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)$",
    re.IGNORECASE,
)


def _cell_value(cell: dict | None):
    return cell.get("v") if cell else None


def _time(hour: str, minute: str | None, meridiem: str) -> str:
    hour24 = int(hour) % 12 + (12 if meridiem.lower() == "pm" else 0)
    return f"{hour24:02d}:{int(minute or 0):02d}:00"


def parse_sheet(text: str, hall_ids_by_sheet_name: dict[str, int]) -> list[dict]:
    payload = json.loads(text[text.index("(") + 1 : text.rindex(")")])
    rows = payload["table"]["rows"]
    dates = [
        datetime.strptime(value, "%m/%d/%Y").replace(tzinfo=TZ).date().isoformat() if value else None
        for value in map(_cell_value, rows[0]["c"][1:])
    ]
    parsed = []
    for row in rows[1:]:
        cells = row["c"]
        venue = _cell_value(cells[0]) if cells else None
        if not venue:
            continue
        parts = venue.split(" | ")
        if (
            len(parts) != 2
            or parts[0] not in hall_ids_by_sheet_name
            or parts[1] not in MEALS
        ):
            logger.warning("Skipping unknown hours row: %s", venue)
            continue
        hall, meal = parts
        for day, cell in zip(dates, cells[1:]):
            value = _cell_value(cell)
            if day is None or value is None:
                continue
            label = str(value).strip()
            if not label:
                continue
            opens = closes = None
            if label.lower() == "closed":
                status = "closed"
            elif match := _TIME_RANGE.fullmatch(label):
                status = "open"
                opens = _time(*match.group(1, 2, 3))
                closes = _time(*match.group(4, 5, 6))
            else:
                status = "tbd"
            parsed.append(
                {
                    "hall_id": hall_ids_by_sheet_name[hall],
                    "date": day,
                    "meal": meal,
                    "status": status,
                    "label": label,
                    "opens": opens,
                    "closes": closes,
                }
            )
    return parsed
