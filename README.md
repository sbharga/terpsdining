# TerpsDining

UMD dining hall hours, menus, food search, nutrition, serving history, and 1–5 star ratings. Items can appear at multiple halls and stations on the same day. Reviews contain no text. Dates and hours use America/New_York.

React, TypeScript, Tailwind, Vite, bun, and Supabase. Python 3.13 with uv collects UMD data; ddgs images are resized to WebP and stored in the public `food-images` bucket. Images are illustrative, not official photos. UMD data is authoritative; this app is not affiliated with UMD.

## Local setup

```sh
bun install --frozen-lockfile
supabase link --project-ref hytfewserkemfzgklfrk
supabase db push --linked
bun run db:types
```

The existing project is `hytfewserkemfzgklfrk`; do not create another. Retrieve keys using the logged-in Supabase CLI:

```sh
supabase projects api-keys --project-ref hytfewserkemfzgklfrk --reveal -o json
```

Use the `publishable` key in `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://hytfewserkemfzgklfrk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Use the `secret` key only in `scraper/.env`:

```dotenv
SUPABASE_URL=https://hytfewserkemfzgklfrk.supabase.co
SUPABASE_SECRET_KEY=<secret key>
```

Both files are ignored. Never put the secret key in a `VITE_` variable or commit it. Without `--reveal`, the CLI returns a masked secret that cannot authenticate.

```sh
bun run dev
# Open http://localhost:5173
```

## Google login

Any Google account is permitted. Create a Google Cloud OAuth client of type Web and configure this authorized redirect URI:

```text
https://hytfewserkemfzgklfrk.supabase.co/auth/v1/callback
```

Export the client credentials, set `enabled = true` under `[auth.external.google]` in `supabase/config.toml`, and push:

```sh
export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID='<client ID>'
export SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET='<client secret>'
supabase config diff
supabase config push --yes
```

Google login is currently disabled because the Google client credentials are not available. The UI already initiates Google OAuth; until configured, Supabase reports that the provider is disabled. A signed-in user can create, edit, or clear one rating per item. Row-level security exposes only that user's reviews; public averages live on items.

## Scraping

```sh
cd scraper
uv sync --frozen
uv run --env-file .env terpsdining-scrape --image-limit 10
uv run --env-file .env terpsdining-scrape --date 2026-10-02 --days 7
```

Flags: `--date YYYY-MM-DD`, `--days N`, `--image-limit N` (default 150), `--skip-images`, `--skip-hours`. `SCRAPE_DATE` and `SCRAPE_DAYS` provide defaults. Hours load the full sheet. A failed menu request preserves that hall/date/meal slot and exits nonzero; a successfully fetched empty menu clears it. Offerings are replaced transactionally and keyed by hall, date, meal, station, and item. Nutrition failures stay eligible for the next run. Images retry after seven days; ddgs rate limits stop the image phase.

`.github/workflows/scrape.yml` runs daily at 10:00 UTC (06:00 EDT / 05:00 EST) and supports manual date/day inputs. Set repository secrets:

```sh
gh secret set SUPABASE_URL --body https://hytfewserkemfzgklfrk.supabase.co
gh secret set SUPABASE_SECRET_KEY
# Paste the secret at the secure prompt.
gh workflow run scrape.yml
```

## Vercel

Import [sbharga/terpsdining](https://github.com/sbharga/terpsdining), the public GitHub repository, into Vercel. Use the Vite preset, build command `bun run build`, and output directory `dist`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Production and Preview. `vercel.json` routes deep links to the SPA.

After deployment, change `site_url` in `supabase/config.toml` to the production URL. Add `https://<prod-domain>/**` and the team's Vercel preview pattern `https://*-<vercel-team>.vercel.app/**` to `additional_redirect_urls`, preserving localhost. Run `supabase config diff` and `supabase config push`. Deployment and production auth URLs require the user's Vercel project/domain.

## Verification

```sh
bun run lint
bun run typecheck
bun run test
bun run build
cd scraper
uv run --frozen ruff check
uv run --frozen pytest
```

The initial hosted scrape for 2026-10-02 produced 595 items and 1,738 offerings; 166 items appeared at multiple halls. Repeating it preserved the offerings count. Label `040065` has 241 calories; ten public WebP images were uploaded during initial verification. Hosted schema lint, anonymous write denial, and transactional rating insert/edit/delete aggregate checks passed. Browser checks covered hall filtering, multi-hall item links, nutrition, search, weekly hours, mobile layout, and unknown routes. Full Google sign-in/rating interaction remains dependent on OAuth configuration.

Hall pages show each meal's hours once, inside its menu-selection tab.
