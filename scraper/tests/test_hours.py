import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path

import pytest

from terpsdining_scraper.config import MEALS, TZ
from terpsdining_scraper.hours import parse_sheet

FIXTURES = Path(__file__).parent / "fixtures"
HALLS = {"South Campus": 16, "Yahentamitsi": 19, "251 North": 51}


def sheet(*rows: tuple[str, str | None]) -> str:
    payload = {
        "table": {
            "rows": [
                {"c": [{"v": "venue"}, {"v": "10/2/2026"}]},
                *[
                    {"c": [{"v": venue}, {"v": value} if value is not None else None]}
                    for venue, value in rows
                ],
            ]
        }
    }
    return "/*O_o*/\ngoogle.visualization.Query.setResponse(" + json.dumps(payload) + ");"


@pytest.mark.parametrize(
    ("value", "status", "opens", "closes", "label"),
    [
        ("7am-10:30am", "open", "07:00:00", "10:30:00", "7am-10:30am"),
        ("11:30am-12:30pm", "open", "11:30:00", "12:30:00", "11:30am-12:30pm"),
        ("12am-12pm", "open", "00:00:00", "12:00:00", "12am-12pm"),
        (" 7 AM – 4:05 PM ", "open", "07:00:00", "16:05:00", "7 AM – 4:05 PM"),
        ("Closed ", "closed", None, None, "Closed"),
        (" cLoSeD ", "closed", None, None, "cLoSeD"),
        ("TBD", "tbd", None, None, "TBD"),
        ("Special hours", "tbd", None, None, "Special hours"),
    ],
)
def test_cell_status(value, status, opens, closes, label):
    assert parse_sheet(sheet(("South Campus | Breakfast", value)), HALLS) == [
        {
            "hall_id": 16,
            "date": "2026-10-02",
            "meal": "Breakfast",
            "status": status,
            "label": label,
            "opens": opens,
            "closes": closes,
        }
    ]


@pytest.mark.parametrize("value", [None, "", "   "])
def test_missing_cells_are_omitted(value):
    assert parse_sheet(sheet(("South Campus | Breakfast", value)), HALLS) == []


@pytest.mark.parametrize(
    "venue", ["Unknown Hall | Lunch", "South Campus | Brunch", "Malformed venue"]
)
def test_unknown_rows_are_skipped_with_warning(venue, caplog):
    result = parse_sheet(
        sheet((venue, "7am-10am"), ("Yahentamitsi | Lunch", "Closed")), HALLS
    )
    assert [(row["hall_id"], row["meal"]) for row in result] == [(19, "Lunch")]
    assert "Skipping unknown hours row" in caplog.text
    assert venue in caplog.text


def test_null_values_and_footer_are_omitted():
    payload = {
        "table": {
            "rows": [
                {"c": [{"v": "venue"}, {"v": "10/2/2026"}]},
                {"c": [{"v": "South Campus | Breakfast"}, {"v": None}]},
                {"c": [None, None]},
            ]
        }
    }
    assert parse_sheet("callback(" + json.dumps(payload) + ");", HALLS) == []


def test_live_fixture_has_every_hall_and_meal_per_date():
    text = (FIXTURES / "sheet.txt").read_text()
    result = parse_sheet(text, HALLS)
    slots_by_date = defaultdict(list)
    for row in result:
        slots_by_date[row["date"]].append((row["hall_id"], row["meal"]))
    header = json.loads(text[text.index("(") + 1 : text.rindex(")")])["table"]["rows"][0]
    expected_dates = {
        datetime.strptime(cell["v"], "%m/%d/%Y").replace(tzinfo=TZ).date().isoformat()
        for cell in header["c"][1:]
    }
    assert set(slots_by_date) == expected_dates
    expected_slots = {(hall_id, meal) for hall_id in HALLS.values() for meal in MEALS}
    for slots in slots_by_date.values():
        assert len(slots) == len(expected_slots)
        assert set(slots) == expected_slots
