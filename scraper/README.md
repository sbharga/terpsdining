# TerpsDining scraper

Run with Python 3.13 and uv:

```sh
uv sync --frozen
uv run --env-file .env terpsdining-scrape --date 2026-10-02 --image-limit 10
uv run --frozen ruff check
uv run --frozen pytest
```

`.env` requires `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Keep it private. See the repository README for hosted setup, backfills, storage, OAuth, and daily automation.

Image searches use Bing only, via DDGS; there is no fallback to another search engine. Images remain illustrative, not official dining hall photos.

To regenerate images for specific existing food IDs:

```sh
uv run --env-file .env terpsdining-scrape --regenerate-images 151365 040065
```

Pass space-separated IDs exactly as stored, including leading zeros. This mode skips hours, menus, and nutrition, ignores `--image-limit`, and processes duplicate IDs only once. It replaces both the full-size image and thumbnail, even when the item already has an image. If no replacement is found, the existing image and database fields are retained. Unknown IDs, failed replacements, or rate limiting produce a nonzero exit status and `images=<count> failures=<count>`. It cannot be combined with `--skip-images`.

Storage objects retain the same URLs and have a seven-day cache lifetime, so previously cached images may not update immediately.

Food images are stored as 480px WebP files, with 160px card images under `thumbs/`. To backfill thumbnails for existing items before deploying the thumbnail-enabled frontend:

```sh
uv run --env-file .env terpsdining-thumbnails
```

The command reports `thumbnails=<count> failures=<count>` and exits nonzero if any object fails. Retry after resolving failures; uploads replace existing thumbnails and use a seven-day cache lifetime.
