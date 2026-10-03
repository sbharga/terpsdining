from dataclasses import FrozenInstanceError
from datetime import date
from pathlib import Path

import httpx
import pytest

from terpsdining_scraper.config import LABEL_BASE
from terpsdining_scraper.menu import fetch_menu, parse_menu

FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="module")
def lunch_entries():
    return parse_menu((FIXTURES / "longmenu_19_lunch.html").read_text())


def test_live_lunch_fixture(lunch_entries):
    assert len(lunch_entries) == 255
    assert lunch_entries[0].station == "Breakfast"
    sausage = next(entry for entry in lunch_entries if entry.item_id == "060063")
    assert sausage.name == "Pork Sausage Link"
    assert sausage.allergens == ("pork",)
    egg = next(entry for entry in lunch_entries if entry.item_id == "040065")
    assert egg.portion == "4 1/2"
    assert egg.label_url == (
        LABEL_BASE
        + "label.aspx?locationNum=19&locationName=&dtdate=10%2f2%2f2026"
        + "&RecNumAndPort=040065*4+1%2f2"
    )
    chicken = next(entry for entry in lunch_entries if entry.item_id == "080464")
    assert "halal" in chicken.dietary


def test_empty_live_menu():
    assert parse_menu((FIXTURES / "longmenu_empty.html").read_text()) == []


def test_station_walk_names_and_tag_normalization():
    html = """
    <table>
      <tr><td>
        <a href="label.aspx?RecNumAndPort=000001*4+1%2f2"> Beans &amp;amp; Rice </a>
        <img class="nutri-icon" alt="Contains pea_protein">
        <img class="nutri-icon" alt="Contains Shellfish">
        <img class="nutri-icon" alt="Contains pea_protein">
        <img class="nutri-icon" alt="HalalFriendly">
        <img class="nutri-icon" alt="vegan">
        <img class="nutri-icon" alt="vegetarian">
        <img class="nutri-icon" alt="vegan">
        <img alt="Contains soy">
      </td></tr>
      <tr><td><strong> Chef's Corner </strong></td></tr>
      <tr><td><strong>Not a header</strong>
        <a href="label.aspx?RecNumAndPort=000001*1">Beans &amp; Rice</a>
      </td></tr>
      <tr><td><strong> Sides </strong></td></tr>
      <tr><td><a href="label.aspx?RecNumAndPort=000002*1">Corn</a></td></tr>
    </table>
    """
    entries = parse_menu(html)
    assert [entry.station for entry in entries] == ["Other", "Chef's Corner", "Sides"]
    assert [entry.item_id for entry in entries] == ["000001", "000001", "000002"]
    assert entries[0].name == entries[1].name == "Beans & Rice"
    assert entries[0].portion == "4 1/2"
    assert entries[0].allergens == ("pea protein", "shellfish")
    assert entries[0].dietary == ("halal", "vegan", "vegetarian")
    assert entries[1].allergens == entries[1].dietary == ()


def test_entries_are_frozen(lunch_entries):
    with pytest.raises(FrozenInstanceError):
        lunch_entries[0].station = "Changed"




def test_fetch_menu_raises_on_http_failure():
    with httpx.Client(
        transport=httpx.MockTransport(lambda request: httpx.Response(503))
    ) as client, pytest.raises(httpx.HTTPStatusError):
        fetch_menu(client, 19, date(2026, 10, 2), "Lunch")
