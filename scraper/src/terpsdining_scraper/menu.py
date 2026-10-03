from dataclasses import dataclass
from datetime import date
from html import unescape
from urllib.parse import parse_qs, urljoin, urlsplit

import httpx
from bs4 import BeautifulSoup

from .config import LABEL_BASE, MENU_URL


@dataclass(frozen=True)
class MenuEntry:
    item_id: str
    name: str
    station: str
    portion: str
    label_url: str
    allergens: tuple[str, ...]
    dietary: tuple[str, ...]


def fetch_menu(client: httpx.Client, hall_id: int, date: date, meal: str) -> str:
    response = client.get(
        MENU_URL,
        params={
            "locationNum": hall_id,
            "dtdate": f"{date.month}/{date.day}/{date.year}",
            "mealName": meal,
        },
    )
    response.raise_for_status()
    return response.text


def parse_menu(html: str) -> list[MenuEntry]:
    soup = BeautifulSoup(html, "html.parser")
    entries = []
    station = "Other"
    for td in soup.find_all("td"):
        link = td.select_one('a[href^="label.aspx"]')
        if link is None:
            header = td.find("strong")
            if header is not None:
                station = header.get_text(strip=True)
            continue
        href = link["href"]
        recipe_and_portion = parse_qs(urlsplit(href).query)["RecNumAndPort"][0]
        item_id, portion = recipe_and_portion.split("*", 1)
        allergens = set()
        dietary = set()
        for icon in td.select("img.nutri-icon"):
            alt = icon.get("alt", "").strip()
            if alt.startswith("Contains "):
                allergens.add(alt.removeprefix("Contains ").lower().replace("_", " "))
            elif alt == "HalalFriendly":
                dietary.add("halal")
            elif alt:
                dietary.add(alt.lower())
        entries.append(
            MenuEntry(
                item_id=item_id,
                name=unescape(link.get_text(strip=True)),
                station=station,
                portion=portion,
                label_url=urljoin(LABEL_BASE, href),
                allergens=tuple(sorted(allergens)),
                dietary=tuple(sorted(dietary)),
            )
        )
    return entries
