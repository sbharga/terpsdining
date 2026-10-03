# TerpsDining scraper

Run with Python 3.13 and uv:

```sh
uv sync --frozen
uv run --env-file .env terpsdining-scrape --date 2026-10-02 --image-limit 10
uv run --frozen ruff check
uv run --frozen pytest
```

`.env` requires `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Keep it private. See the repository README for hosted setup, backfills, storage, OAuth, and daily automation.

Food images are stored as 480px WebP files, with 160px card images under `thumbs/`. To backfill thumbnails for existing items before deploying the thumbnail-enabled frontend:

```sh
uv run --env-file .env terpsdining-thumbnails
```

The command reports `thumbnails=<count> failures=<count>` and exits nonzero if any object fails. Retry after resolving failures; uploads replace existing thumbnails and use a seven-day cache lifetime.
