import pytest

from terpsdining_scraper.names import normalize_name

CASES = [
    (
        "SPICY FRIED CHICKEN SANDWICH WITH COLESLAW",
        "Spicy Fried Chicken Sandwich with Coleslaw",
    ),
    ("BLT WITH LEMON HERB AIOLI", "BLT with Lemon Herb Aioli"),
    ("sauteed swiss chard", "Sauteed Swiss Chard"),
    (
        "Shredded Smoked Pork Shoulder (no bbq sauce)",
        "Shredded Smoked Pork Shoulder (No BBQ Sauce)",
    ),
    ("Turkey Wrap W/ Chipotle Aioli", "Turkey Wrap w/ Chipotle Aioli"),
    ("Tortellini w/Spinach & Olives", "Tortellini w/Spinach & Olives"),
    ("Chili Con Queso", "Chili con Queso"),
    ("with sauce", "With Sauce"),
    ("UDI'S  BURGER BUN", "Udi's Burger Bun"),
    ("McDonald's Fries", "McDonald's Fries"),
    ("BBQ Chicken (8way)", "BBQ Chicken (8way)"),
    ("JALAPEÑO POPPERS", "Jalapeño Poppers"),
    ("Pico de Gallo", "Pico de Gallo"),
]


@pytest.mark.parametrize(("raw", "expected"), CASES)
def test_normalize_name(raw, expected):
    assert normalize_name(raw) == expected


@pytest.mark.parametrize("raw", [raw for raw, _ in CASES])
def test_normalize_name_is_idempotent(raw):
    assert normalize_name(normalize_name(raw)) == normalize_name(raw)
