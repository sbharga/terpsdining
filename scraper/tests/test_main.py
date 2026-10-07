import sys
from types import SimpleNamespace

import httpx
import pytest
from ddgs.exceptions import RatelimitException

from terpsdining_scraper import main


class ItemStore:
    def __init__(self):
        self.rows = {
            "040065": {"id": "040065", "name": "Rice", "image_path": "old.webp"},
            "000002": {"id": "000002", "name": "Soup", "image_path": "soup.webp"},
            "000003": {"id": "000003", "name": "Bread", "image_path": "bread.webp"},
        }
        self.ids = []

    def table(self, name):
        assert name == "items"
        return self

    def select(self, fields):
        return self

    def in_(self, field, values):
        self.ids = values
        return self

    def execute(self):
        return SimpleNamespace(data=[self.rows[id].copy() for id in self.ids if id in self.rows])

    def update(self, item_id, fields):
        self.rows[item_id].update(fields)


@pytest.fixture
def store(monkeypatch):
    store = ItemStore()
    monkeypatch.setattr(main.db, "client", lambda: store)
    monkeypatch.setattr(main.db, "update_item", store.update)
    monkeypatch.setattr(main.time, "sleep", lambda _: None)
    return store


def test_regeneration_only_selected_ids_once(store, monkeypatch, capsys):
    attempts = []

    def regenerate(http, sb, item_id, name):
        attempts.append(item_id)
        return f"{item_id}.webp"

    monkeypatch.setattr(main, "fetch_and_store_image", regenerate)
    monkeypatch.setattr(sys, "argv", ["scraper", "--regenerate-images", "040065", "040065"])
    assert main.main() == 0
    assert attempts == ["040065"]
    assert store.rows["040065"]["image_path"] == "040065.webp"
    assert store.rows["000002"] == {
        "id": "000002", "name": "Soup", "image_path": "soup.webp"
    }
    assert capsys.readouterr().out == "images=1 failures=0\n"


def test_failed_regeneration_and_unknown_id_preserve_existing_image(store, monkeypatch, capsys):
    before = store.rows["040065"].copy()
    monkeypatch.setattr(main, "fetch_and_store_image", lambda *args: None)
    with httpx.Client() as http:
        result = main._regenerate_images(http, store, ["040065", "missing"])
    assert result == 1
    assert store.rows["040065"] == before
    assert capsys.readouterr().out == "images=0 failures=2\n"


def test_rate_limit_counts_unprocessed_ids_and_preserves_them(store, monkeypatch, capsys):
    before = {id: row.copy() for id, row in store.rows.items()}

    def regenerate(http, sb, item_id, name):
        if item_id == "000002":
            raise RatelimitException("limited")
        return f"{item_id}.webp"

    monkeypatch.setattr(main, "fetch_and_store_image", regenerate)
    with httpx.Client() as http:
        result = main._regenerate_images(http, store, ["040065", "000002", "000003", "missing"])
    assert result == 1
    assert store.rows["040065"]["image_path"] == "040065.webp"
    assert store.rows["000002"] == before["000002"]
    assert store.rows["000003"] == before["000003"]
    assert capsys.readouterr().out == "images=1 failures=3\n"


def test_daily_scrape_prunes_history_with_images_skipped(monkeypatch, capsys):
    prunes = []
    monkeypatch.setattr(main.db, "client", lambda: None)
    monkeypatch.setattr(main.db, "upsert_hours", lambda rows: None)
    monkeypatch.setattr(main.db, "upsert_items", lambda rows: None)
    monkeypatch.setattr(main.db, "replace_offerings", lambda *args: None)
    monkeypatch.setattr(main.db, "items_needing_nutrition", lambda limit: [])
    monkeypatch.setattr(main, "fetch_menu", lambda *args: "")
    monkeypatch.setattr(main, "parse_menu", lambda html: [])

    def prune():
        prunes.append(True)
        return 7

    monkeypatch.setattr(main.db, "prune_history", prune)
    monkeypatch.setattr(sys, "argv", ["scraper", "--skip-hours", "--skip-images"])
    assert main.main() == 0
    assert prunes == [True]
    assert capsys.readouterr().out.endswith("pruned=7 failures=0\n")


def test_regeneration_does_not_prune_history(store, monkeypatch):
    def prune():
        pytest.fail("Image regeneration must not prune history")

    monkeypatch.setattr(main.db, "prune_history", prune)
    monkeypatch.setattr(main, "fetch_and_store_image", lambda *args: "new.webp")
    monkeypatch.setattr(sys, "argv", ["scraper", "--regenerate-images", "040065"])
    assert main.main() == 0
