"""Persistence helpers for the scraper's service-role Supabase client."""

import os
from datetime import UTC, datetime, timedelta
from functools import cache

from supabase import Client, create_client


@cache
def client() -> Client:
    try:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SECRET_KEY"]
    except KeyError:
        raise SystemExit("SUPABASE_URL and SUPABASE_SECRET_KEY are required") from None
    if not url or not key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SECRET_KEY are required")
    return create_client(url, key)


def upsert_hours(rows: list[dict]) -> None:
    for start in range(0, len(rows), 500):
        client().table("hours").upsert(
            rows[start : start + 500], on_conflict="hall_id,date,meal"
        ).execute()


def upsert_items(rows: list[dict]) -> None:
    keys = ("id", "name", "allergens", "dietary", "label_url")
    for start in range(0, len(rows), 500):
        payload = [
            {key: row[key] for key in keys} for row in rows[start : start + 500]
        ]
        client().table("items").upsert(payload, on_conflict="id").execute()


def replace_offerings(
    hall_id: int, date: str, meal: str, rows: list[dict]
) -> None:
    client().rpc(
        "replace_offerings",
        {"p_hall": hall_id, "p_date": date, "p_meal": meal, "p_rows": rows},
    ).execute()


def prune_history() -> int:
    return client().rpc("prune_history").execute().data


def items_needing_nutrition(limit: int) -> list[dict]:
    return (
        client()
        .table("items")
        .select("id,label_url")
        .is_("nutrition_checked_at", "null")
        .not_.is_("label_url", "null")
        .limit(limit)
        .execute()
        .data
    )


def items_needing_images(limit: int) -> list[dict]:
    retry_before = (datetime.now(UTC) - timedelta(days=7)).isoformat()
    return (
        client()
        .table("items")
        .select("id,name")
        .is_("image_path", "null")
        .or_(f"image_checked_at.is.null,image_checked_at.lt.{retry_before}")
        .order("last_seen", desc=True)
        .limit(limit)
        .execute()
        .data
    )


def image_paths() -> list[str]:
    paths = []
    start = 0
    while True:
        page = (
            client()
            .table("items")
            .select("image_path")
            .not_.is_("image_path", "null")
            .order("id")
            .range(start, start + 999)
            .execute()
            .data
        )
        paths.extend(row["image_path"] for row in page)
        if len(page) < 1000:
            return paths
        start += 1000


def update_item(id: str, fields: dict) -> None:
    client().table("items").update(fields).eq("id", id).execute()
