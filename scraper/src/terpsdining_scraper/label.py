import re

from bs4 import BeautifulSoup, Tag

_DAILY_VALUE = re.compile(r"^\d+%$")
_ADDED_SUGARS = re.compile(r"^Includes\s+(\S+)\s+Added Sugars$")
_NUTRIENT = re.compile(r"^(.+?)\.?\s+([\d.]+\s*(?:g|mg|mcg|kcal|IU))$")


def _text(element: Tag | None) -> str | None:
    if element is None:
        return None
    return " ".join(element.get_text(" ").replace("\xa0", " ").split()) or None


def parse_label(html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    servings = _text(soup.select_one("div.nutfactsservpercont"))
    serving_sizes = soup.select("div.nutfactsservsize")
    serving_size = _text(serving_sizes[1]) if len(serving_sizes) > 1 else None
    calories = None
    calories_heading = next(
        (p for p in soup.find_all("p") if _text(p) == "Calories per serving"),
        None,
    )
    if calories_heading is not None:
        calorie_text = _text(calories_heading.find_next_sibling("p"))
        if calorie_text:
            try:
                calories = round(float(calorie_text))
            except (ValueError, OverflowError):
                pass

    # Keep every occurrence during the walk, so a duplicate's DV cannot attach
    # to a different nutrient. Deduplicate only after each DV has been attached.
    nutrients = []
    for span in soup.select("span.nutfactstopnutrient"):
        text = _text(span)
        if not text:
            continue
        if _DAILY_VALUE.fullmatch(text):
            if nutrients and nutrients[-1]["dv"] is None:
                nutrients[-1]["dv"] = text
            continue
        if match := _ADDED_SUGARS.fullmatch(text):
            name, amount = "Added Sugars", match.group(1)
        elif match := _NUTRIENT.fullmatch(text):
            name, amount = match.groups()
        else:
            continue
        nutrients.append({"name": name, "amount": amount, "dv": None})

    unique_nutrients = []
    seen = {"calories", "fat"}
    for nutrient in nutrients:
        key = nutrient["name"].lower()
        if key not in seen:
            seen.add(key)
            unique_nutrients.append(nutrient)

    return {
        "nutrition": {
            "servings": servings,
            "serving_size": serving_size,
            "calories": calories,
            "nutrients": unique_nutrients,
        },
        "ingredients": _text(soup.select_one("span.labelingredientsvalue")),
        "label_allergens": _text(soup.select_one("span.labelallergensvalue")),
    }
