"""Item name casing, typo fixes, and the one-off backfill for stored names."""

import re

from . import db

SMALL_WORDS = frozenset(
    {
        *("al", "ala", "an", "and", "as", "at", "but", "by", "con", "de", "del"),
        *("di", "en", "for", "in", "la", "of", "on", "or", "the", "to", "w", "with"),
    }
)
ACRONYMS = frozenset({"BBQ", "BLT", "FF", "GF", "NY", "PB", "RTU", "VGN"})
# Misspellings found in UMD's menu data, keyed by lowercase word.
TYPOS = {
    "ailoi": "aioli",
    "aiol": "aioli",
    "alferdo": "alfredo",
    "alredo": "alfredo",
    "amd": "and",
    "andoulle": "andouille",
    "artichole": "artichoke",
    "asaparagus": "asparagus",
    "atrichokes": "artichokes",
    "avacado": "avocado",
    "balck": "black",
    "barrumundi": "barramundi",
    "bolgnase": "bolognese",
    "bolgogi": "bulgogi",
    "brasied": "braised",
    "broccili": "broccoli",
    "bulger": "bulgur",
    "callion": "scallion",
    "capresa": "caprese",
    "carmelized": "caramelized",
    "carribean": "caribbean",
    "cauliflowrer": "cauliflower",
    "caulifower": "cauliflower",
    "cheedar": "cheddar",
    "chickpes": "chickpeas",
    "chikcen": "chicken",
    "chimichuri": "chimichurri",
    "chioppino": "cioppino",
    "chipolte": "chipotle",
    "cripy": "crispy",
    "cruch": "crunch",
    "dakon": "daikon",
    "enchillada": "enchilada",
    "ethiopean": "ethiopian",
    "eygptian": "egyptian",
    "falafal": "falafel",
    "fettucini": "fettuccine",
    "flabread": "flatbread",
    "freid": "fried",
    "fritata": "frittata",
    "fritatta": "frittata",
    "ginnger": "ginger",
    "goddness": "goddess",
    "grillled": "grilled",
    "guferati": "gujarati",
    "jalepeno": "jalapeno",
    "jamacian": "jamaican",
    "jollf": "jollof",
    "lemosgrass": "lemongrass",
    "linguni": "linguini",
    "mediterranian": "mediterranean",
    "mozzeralla": "mozzarella",
    "mushrrom": "mushroom",
    "mushrroms": "mushrooms",
    "musroom": "mushroom",
    "noodlr": "noodle",
    "pablano": "poblano",
    "panan": "panang",
    "papriikash": "paprikash",
    "patae": "pasta",
    "pest": "pesto",
    "picatta": "piccata",
    "piccatta": "piccata",
    "pickeled": "pickled",
    "pinapple": "pineapple",
    "potaoes": "potatoes",
    "potaotes": "potatoes",
    "primevera": "primavera",
    "pumkin": "pumpkin",
    "ratatouile": "ratatouille",
    "raviloi": "ravioli",
    "rueben": "reuben",
    "sandwhich": "sandwich",
    "sandwic": "sandwich",
    "sauted": "sauteed",
    "shashuska": "shakshuka",
    "sheperd's": "shepherd's",
    "shitake": "shiitake",
    "slavadorian": "salvadoran",
    "slicy": "spicy",
    "smokedhouse": "smokehouse",
    "soutwestern": "southwestern",
    "succoatash": "succotash",
    "suffing": "stuffing",
    "swseet": "sweet",
    "tamarand": "tamarind",
    "tamarrind": "tamarind",
    "teryaki": "teriyaki",
    "tilapa": "tilapia",
    "tomatila": "tomatillo",
    "tomatos": "tomatoes",
    "tortelini": "tortellini",
    "tumeric": "turmeric",
    "vegeatble": "vegetable",
    "vermicelle": "vermicelli",
    "vinagrette": "vinaigrette",
    "vinaigre": "vinaigrette",
    "wth": "with",
    "zuchini": "zucchini",
}
WORD = re.compile(r"[^\W_]+(?:'[^\W_]+)*")


def normalize_name(name: str) -> str:
    first = True

    def case(match: re.Match[str]) -> str:
        nonlocal first
        word = match.group()
        is_first, first = first, False
        lower = word.lower()
        if lower in TYPOS:
            word = lower = TYPOS[lower]
        if word.upper() in ACRONYMS:
            return word.upper()
        if not is_first and lower in SMALL_WORDS:
            return lower
        if word.isupper() or word.islower():
            return lower[0].upper() + lower[1:]
        return word

    return WORD.sub(case, " ".join(name.split()))


def main() -> int:
    renamed = 0
    for item in db.item_names():
        name = normalize_name(item["name"])
        if name != item["name"]:
            db.update_item(item["id"], {"name": name})
            renamed += 1
    print(f"renamed={renamed}")
    return 0
