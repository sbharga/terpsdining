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

Import [sbharga/terpsdining](https://github.com/sbharga/terpsdining), the public GitHub repository, into Vercel. Use the Vite preset, install command `bun install --frozen-lockfile`, build command `bun run build`, and output directory `dist`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Production and Preview. `vercel.json` serves prerendered pages at extensionless URLs and preserves live item deep links for items discovered after a deployment.

After deployment, change `site_url` in `supabase/config.toml` to the production URL. Add `https://<prod-domain>/**` and the team's Vercel preview pattern `https://*-<vercel-team>.vercel.app/**` to `additional_redirect_urls`, preserving localhost. Run `supabase config diff` and `supabase config push`. Deployment and production auth URLs require the user's Vercel project/domain.

### Privacy and terms

The footer links to `/privacy` and `/terms`. After deploying, use `https://<your-project>.vercel.app/privacy` and `https://<your-project>.vercel.app/terms` in Google Auth Platform's Branding settings, with the deployed root URL as the homepage. These pages work on the assigned Vercel hostname without a custom domain. This does not waive Google's separate authorized-domain or ownership-verification requirements; follow the requirements shown in its Verification Center.

Both pages use `support@docet.org` for inquiries and account-data requests. Ensure that mailbox is monitored. Account deletion requests require manual handling by an authorized Supabase administrator; signing out or revoking Google access does not delete the account. Review the policies before public launch and update them whenever data practices change.

### Search engine indexing

The production origin is `https://terpsdining.vercel.app`, shared in `src/lib/seo.ts`. The build uses the public Supabase URL and publishable key to render the actual React pages into HTML before deployment. Home, halls, weekly hours, legal pages, and every stored item receive initial content, descriptive titles, descriptions, canonical URLs, Open Graph/Twitter previews, and WebSite structured data. The footer also links to the public GitHub repository.

`/sitemap.xml` lists indexable canonical pages; `/robots.txt` advertises it. Search, the item fallback shell, and missing pages are marked `noindex`. Query parameters do not create separate canonical pages. Vercel preview deployments should retain Vercel's default noindex protection.

Prerendered menus, hours, item details, and sitemap entries are snapshots refreshed on each deployment. The browser still fetches live Supabase data. Newly scraped items remain accessible through the live item fallback, but need a new deployment for initial HTML and sitemap inclusion. To refresh crawler snapshots after new data, redeploy in Vercel. Build failures fetching public data stop deployment rather than publish empty content. CI uses repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`; no service secret is used for prerendering.

In Google Search Console, add a **URL-prefix** property for `https://terpsdining.vercel.app/` (no custom domain required). Verify using the provided HTML file uploaded into `public/` and redeploy, then submit `https://terpsdining.vercel.app/sitemap.xml`. Do not choose Domain-property DNS verification for the shared `vercel.app` domain. Use URL Inspection to request indexing of the home and hall pages. Search engines decide when and whether to index pages; these changes do not guarantee rankings.



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
