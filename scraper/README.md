# TerpsDining scraper

Run with Python 3.13 and uv:

```sh
uv sync --frozen
uv run --env-file .env terpsdining-scrape --date 2026-10-02 --image-limit 10
uv run --frozen ruff check
uv run --frozen pytest
```

`.env` requires `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Keep it private. See the repository README for hosted setup, backfills, storage, OAuth, and daily automation.
