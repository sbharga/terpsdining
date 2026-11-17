"""Item name casing and the one-off backfill for stored names."""

import re

from . import db

SMALL_WORDS = frozenset(
    {
        *("al", "ala", "an", "and", "as", "at", "but", "by", "con", "de", "del"),
        *("di", "en", "for", "in", "la", "of", "on", "or", "the", "to", "w", "with"),
    }
)
ACRONYMS = frozenset({"BBQ", "BLT", "FF", "GF", "NY", "PB", "RTU", "VGN"})
WORD = re.compile(r"[^\W_]+(?:'[^\W_]+)*")


def normalize_name(name: str) -> str:
    first = True

    def case(match: re.Match[str]) -> str:
        nonlocal first
        word = match.group()
        is_first, first = first, False
        lower = word.lower()
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
