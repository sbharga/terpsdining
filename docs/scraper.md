# Scraper

The scraper in `scraper/` (Python 3.13, managed with [uv](https://docs.astral.sh/uv/)) collects dining hall hours, menus, nutrition labels, and food images into Supabase. Data sources are described in [data-sources.md](data-sources.md). Hosted setup, scheduling, and deploy order are in [deployment.md](deployment.md).

## Setup

```sh
cd scraper
cp .env.example .env
uv sync --frozen
```

Set these in `scraper/.env`:

```dotenv
SUPABASE_URL=<Supabase project URL>
SUPABASE_SECRET_KEY=<secret key>
```

The secret key has write access to the database and storage. Keep `.env` private (it is ignored by Git), and never expose it through a `VITE_` variable or any browser code.

## Run

```sh
uv run --env-file .env terpsdining-scrape --date 2026-10-02 --image-limit 10
```

Run commands from `scraper/`. Without `--date`, the scraper uses today's date in America/New_York. `SCRAPE_DATE` and `SCRAPE_DAYS` set the defaults for `--date` and `--days` (the GitHub Actions workflow uses them).

The run prints one summary line:

```text
hours=<n> items=<n> merged=<n> offerings=<n> nutrition=<n> images=<n> pruned=<n> failures=<n>
```

The process exits nonzero when a menu request failed.

### Options

| Option | Effect |
| --- | --- |
| `--date YYYY-MM-DD` | First date to scrape. Default: today (America/New_York). |
| `--days N` | Number of consecutive days from `--date`. Default: 1. |
| `--image-limit N` | Maximum number of items to search for images in one run. Default: 150. |
| `--skip-images` | Skip the image phase. |
| `--skip-hours` | Skip the hours sheet. |
| `--hours-only` | Refresh hours only; skip menus, nutrition, images, and pruning. Prints `hours=<n> changed=<n>` and writes `changed=<n>` to `$GITHUB_OUTPUT` when it is set. |
| `--regenerate-images ID …` | Replace images for the listed food IDs only (see [Images](#images)). |
| `--clear-images ID …` | Remove stored images for the listed food IDs so the daily scrape searches again (see [Images](#clearing-images)). |

Invalid combinations are rejected: `--regenerate-images` cannot be combined with `--skip-images`, `--hours-only` cannot be combined with `--skip-hours` or `--regenerate-images`, and `--clear-images` cannot be combined with `--regenerate-images` or `--hours-only`.

## Failure semantics

- **Menu request fails:** the failure is logged and counted in `failures`. Existing offerings for that hall, meal, and date are preserved, the other slots still run, and the process exits nonzero.
- **Menu is empty:** the request succeeded, so that slot's stale offerings are cleared.
- **Nutrition label fails:** the failure is logged and counted. The item keeps no nutrition values and is retried on a later run.
- **Bing rate limit during images:** the image phase stops early and the run continues to pruning. This does not set a nonzero exit status.
- Offerings are stored per item, hall, meal, and station, so one item can appear in several halls, meals, or stations on the same day.

## Images

- Image searches use Bing only, through DDGS. There is no fallback to another search engine.
- Full-size images are stored in the `food-images` bucket as 480px WebP. Card thumbnails are 160px WebP under `thumbs/`.
- Uploads use a seven-day cache lifetime. Items whose image search found nothing are retried after seven days.
- A search result is used only if its title shares at least one word with the item name (case-insensitive, plural "s" ignored, words under three letters and "and", "with", "the", "food" ignored). Names with no usable words accept any result.
- Images are illustrative, not official dining hall photos.

### Regenerating images

Replace images for specific existing food IDs without scraping menus, hours, or nutrition:

```sh
uv run --env-file .env terpsdining-scrape --regenerate-images 151365 040065
```

- IDs are space-separated and must match the stored IDs exactly, including leading zeros. Duplicates are processed once.
- Both the full-size image and the thumbnail are replaced, even when the item already has an image. If no replacement is found, the existing image and database fields are kept.
- `--image-limit` is ignored in this mode.
- Unknown IDs, failed replacements, and rate limiting are counted as failures. The run prints `images=<count> failures=<count>` and exits nonzero if `failures` is greater than zero.
- Storage objects keep the same URLs with a seven-day cache lifetime, so cached copies may not update immediately.

### Clearing images

Remove stored images for specific food IDs (for example, images that do not show food) so the daily scrape searches for them again:

```sh
uv run --env-file .env terpsdining-scrape --clear-images 115154
```

- Each ID has `image_path` and `image_checked_at` set to null, and its full-size and thumbnail objects are deleted from storage. The database is updated first so the site never points at a deleted object.
- The next daily runs pick the items up, most recently served first, up to `--image-limit` per run.
- This mode does not contact Bing or UMD. Unknown IDs and failed storage deletes are counted as failures. The run prints `cleared=<count> failures=<count>` and exits nonzero if `failures` is greater than zero. Rerunning is safe.

## Duplicate items

UMD sometimes gives one dish several recipe IDs. After upserting items, every run calls the `merge_items` database function (`supabase/migrations/20261107000000_merge_duplicate_items.sql`), which merges items whose names match after lowercasing and collapsing whitespace. The newly merged count is reported as `merged=`.

- The main item is the one with the earliest `first_seen` (nulls last), then the lowest ID. Others get `canonical_id` set to the main item's ID and are called aliases. Merges are permanent: a later rename never splits a group.
- Ratings, favorites, and offerings move to the main item. If a user rated several recipes, only their most recently updated rating is kept.
- The scraper writes each recipe's own tags to `recipe_allergens` and `recipe_dietary`. `merge_items` derives `allergens` (union) and `dietary` (intersection) on the main item. Aliases keep their own tags in `allergens`/`dietary`.
- `replace_offerings` maps alias IDs to the main item, so menus show a dish once. Aliases keep their nutrition fetch but never trigger image searches.
- The site redirects alias URLs to the main item, whose page lists each recipe's nutrition and ingredients.

## History pruning

Every run that is not `--hours-only`, `--regenerate-images`, or `--clear-images` ends by calling the `prune_history` database function. It deletes offerings and hours dated more than one year before today (America/New_York). Items, ratings, favorites, and `first_seen`/`last_seen` are kept. The deleted count is reported as `pruned=`.

The function is defined in `supabase/migrations/20261007000000_prune_history.sql`. Apply that migration before running the updated scraper; otherwise the RPC returns 404 and the job fails.

## Thumbnail backfill

Existing items with a stored full-size image need a 160px thumbnail under `thumbs/` before the thumbnail-enabled frontend is deployed:

```sh
cd scraper && uv run --env-file .env terpsdining-thumbnails
```

The command prints `thumbnails=<count> failures=<count>` and exits nonzero if any object fails. Resolve the failures and rerun until `failures=0`. Uploads replace existing thumbnails. See [deployment.md](deployment.md) for where this step fits in the deploy order.

## Checks

```sh
cd scraper
uv run --frozen ruff check
uv run --frozen pytest
```

Tests live in `scraper/tests/` and use saved HTML and text fixtures in `scraper/tests/fixtures/`. Tests must not call the live UMD sites or Supabase.
