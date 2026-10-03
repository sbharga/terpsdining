from pathlib import Path

import pytest

from terpsdining_scraper.label import parse_label

FIXTURES = Path(__file__).parent / "fixtures"


def test_live_label_fixture():
    result = parse_label((FIXTURES / "label_040065.html").read_text())
    nutrition = result["nutrition"]
    assert nutrition["servings"] == "1 servings per container"
    assert nutrition["serving_size"] == "4 1/2 oz"
    assert nutrition["calories"] == 241
    nutrients = {nutrient["name"]: nutrient for nutrient in nutrition["nutrients"]}
    assert nutrients["Total Carbohydrate"] == {
        "name": "Total Carbohydrate", "amount": "1.3g", "dv": "1%"
    }
    assert nutrients["Iron"]["dv"] == "13%"
    assert nutrients["Added Sugars"]["amount"] == "0g"
    assert "Calories" not in nutrients
    assert "Fat" not in nutrients
    assert result["label_allergens"] == "Dairy, Eggs"
    assert result["ingredients"].startswith("Liquid Eggs")


def test_nutrient_dv_state_and_first_occurrence_wins():
    html = """
    <span class="nutfactstopnutrient">5%</span>
    <span class="nutfactstopnutrient"> Total&nbsp;Fat. <b>17.5g</b> </span>
    <span class="nutfactstopnutrient">&nbsp;</span>
    <span class="nutfactstopnutrient">20%</span>
    <span class="nutfactstopnutrient">30%</span>
    <span class="nutfactstopnutrient">total fat 99g</span>
    <span class="nutfactstopnutrient">90%</span>
    <span class="nutfactstopnutrient">Iron 2.3mg</span>
    <span class="nutfactstopnutrient">Fat 17.5g</span>
    <span class="nutfactstopnutrient">13%</span>
    <span class="nutfactstopnutrient">Calories 241.3kcal</span>
    <span class="nutfactstopnutrient">40%</span>
    <span class="nutfactstopnutrient">Includes 0g Added Sugars</span>
    <span class="nutfactstopnutrient">0%</span>
    <span class="nutfactstopnutrient">Vitamin A 20 mcg</span>
    <span class="nutfactstopnutrient">Vitamin D 10IU</span>
    """
    nutrients = parse_label(html)["nutrition"]["nutrients"]
    assert nutrients == [
        {"name": "Total Fat", "amount": "17.5g", "dv": "20%"},
        {"name": "Iron", "amount": "2.3mg", "dv": None},
        {"name": "Added Sugars", "amount": "0g", "dv": "0%"},
        {"name": "Vitamin A", "amount": "20 mcg", "dv": None},
        {"name": "Vitamin D", "amount": "10IU", "dv": None},
    ]


@pytest.mark.parametrize(
    "html",
    [
        "",
        "<html><body>No label</body></html>",
        '<div class="nutfactsservsize">Serving size</div>',
        "<p>Calories per serving</p>",
    ],
)
def test_missing_label_pieces_are_none(html):
    assert parse_label(html) == {
        "nutrition": {
            "servings": None,
            "serving_size": None,
            "calories": None,
            "nutrients": [],
        },
        "ingredients": None,
        "label_allergens": None,
    }


def test_partial_label_and_calorie_rounding():
    result = parse_label("""
        <p>Calories per serving</p><p>241.6</p>
        <span class="labelingredientsvalue"> Rice&nbsp;  flour\n and water </span>
        <span class="labelallergensvalue">&nbsp;</span>
    """)
    assert result["nutrition"]["calories"] == 242
    assert result["nutrition"]["serving_size"] is None
    assert result["ingredients"] == "Rice flour and water"
    assert result["label_allergens"] is None


def test_non_numeric_calories_are_none():
    assert parse_label("<p>Calories per serving</p><p>N/A</p>")["nutrition"]["calories"] is None
