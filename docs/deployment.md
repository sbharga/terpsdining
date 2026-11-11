# Deployment

A hosted TerpsDining has three parts: a Supabase project (database, storage, and Google sign-in), a Vercel site that prerenders and serves the frontend, and GitHub Actions workflows that scrape UMD data. For local development, see the [README](../README.md#quick-start).

## Supabase project

1. Create a Supabase project.
2. Apply every file in `supabase/migrations/`, in filename order.
3. Configure Google OAuth in Supabase. The authorized Google callback is your Supabase project's `/auth/v1/callback` URL. Supabase's redirect allowlist must include your frontend URL.
4. Use `docs/google-oauth-logo.png` as the logo on the Google consent screen.
5. The `db:types` script regenerates `src/lib/database.types.ts` from the Supabase project ID written in `package.json`. Change that ID before using the script with another project.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Vercel; CI repository variable | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel; CI repository variable | Publishable key |
| `SUPABASE_URL` | GitHub Actions secret; `scraper/.env` | Supabase project URL for the scraper |
| `SUPABASE_SECRET_KEY` | GitHub Actions secret; `scraper/.env` | Secret key for the scraper |

- The frontend build and prerendering need only the publishable key.
- Never put a Supabase secret key or the Google client secret in a `VITE_` variable. Vite embeds `VITE_` variables in the public bundle.
- Never commit credentials. Environment files are ignored by Git.

## Vercel

Create a project from the repository with these settings:

- Framework preset: Vite
- Root directory: repository root
- Install command: `bun install --frozen-lockfile`
- Build command: `bun run build`
- Output directory: `dist`

Configure the frontend environment variables for the deployment.

Create a Deploy Hook for the production branch. Store its URL as the GitHub Actions secret `VERCEL_DEPLOY_HOOK_URL` (see below).

## GitHub Actions

Repository variables and secrets:

- **Variables** (used by CI builds): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Secrets** (used by the scraper and rebuild steps): `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VERCEL_DEPLOY_HOOK_URL`.

Independent deployments must supply their own scraper credentials through these secrets, never through source files.

### Scheduling

There is no built-in GitHub schedule. Both dining-data workflows run through `workflow_dispatch` and are triggered externally, for example by cron-job.org. Authenticate every request with a fine-grained GitHub token restricted to this repository with Actions write permission. Store the token in the cron-job.org `Authorization` header, never in source files.

- **Daily scrape** (`scrape.yml`, "Daily dining data"): POST `{"ref":"main"}` to `https://api.github.com/repos/sbharga/terpsdining/actions/workflows/scrape.yml/dispatches` daily at 3:00 a.m. in `America/New_York`. Use the America/New_York time zone so the schedule follows daylight saving time. The workflow accepts optional `date` (YYYY-MM-DD) and `days` inputs, which default to today and 1. It runs `terpsdining-scrape` and then requests a rebuild after the scrape, including after partial menu failures. Menus update after the scrape and site rebuild finish.
- **Hours refresh** (`hours.yml`, "Hours refresh"): runs `terpsdining-scrape --hours-only`. It rebuilds the site only when a row in the next seven days changed. Add a second cron-job.org job that POSTs `{"ref":"main"}` every 15 minutes to `https://api.github.com/repos/sbharga/terpsdining/actions/workflows/hours.yml/dispatches`.

The rebuild step calls `VERCEL_DEPLOY_HOOK_URL`. If the secret is unset, the rebuild step is skipped. The browser also refetches hours when its copy is more than 15 minutes old.

CI (`ci.yml`) runs on every push and pull request: `bun run lint`, `typecheck`, `test`, and `build` for the frontend, and `ruff check` and `pytest` for the scraper.

## Health endpoint

`GET /api/health` is a Vercel function (`api/health.ts`) for status pages and uptime monitors. It reads one row from `halls` through Supabase's REST API with the publishable key, using the `VITE_SUPABASE_*` variables from the Vercel project, and times out after five seconds.

- Healthy: HTTP 200 with `{"status":"ok","checks":{"database":"ok"},"latencyMs":123}`.
- Unhealthy (Supabase unreachable, slow, erroring, empty, or the variables are missing): HTTP 503 with `{"status":"down","checks":{"database":"fail"},...}`.
- Responses are `Cache-Control: no-store`. Error details are not exposed.
- It does not check scraper freshness. Stale menus still report healthy.

Point your status page at `https://<your-domain>/api/health` and alert on a non-200 status.

## Build, prerendering, and caching

- The build fetches public Supabase data and prerenders pages into `dist/`. It requires the frontend environment variables and network access. Data-fetch errors fail the build rather than generating empty pages.
- Pages have route-specific metadata, canonical URLs, social previews, and initial HTML content. Item pages get a description built from their calories, protein, diet, and allergens. `/sitemap.xml` lists indexable pages without `<lastmod>`, because the content changes daily and a build-date `lastmod` makes search results show a stale “N days ago” date. `/robots.txt` advertises the sitemap. `/search` with no query is an indexable, prerendered A–Z directory that links to every item page, so no item is an orphan. Account and missing pages are marked `noindex`. Canonicals omit query parameters. The home page marks its date and live hours and ratings with `data-nosnippet` so search snippets use the meta description instead of today’s hours. Search engines determine indexing and rankings.
- Prerendered content and sitemap entries refresh on deployment. Public query data is embedded in each menu, hours, and item page and restored before the first client render.
- Embedded query data counts as fresh when the page loads, however old the build is, so landing on a prerendered page makes no data requests. Each query then stays fresh for its own time: hours 15 minutes, menus 30 minutes, history and the A–Z directory six hours, and other queries five minutes. Ratings shown on first view can be up to one build old; a signed-in user's own rating is fetched live.
- Newly scraped items remain accessible before the next deployment, but they need a rebuild to appear in initial HTML and the sitemap.
- Hashed `/assets/` files have a one-year immutable cache policy. Food objects use a seven-day cache policy.
- Only the Latin subsets of the two bundled fonts are shipped.
- Item pages outside the prerendered set are served by `item-shell.html` (`vercel.json` rewrites `/items/:id` to `/item-shell`), which loads the item in the browser. Merged duplicate items get a static page that redirects to their main item.

## Deploy order

1. Apply the search and history migrations, `20261005000000_search_pages_item_histories.sql` and `20261006000000_search_all_words.sql`, before deploying the frontend.
2. Backfill existing card thumbnails with the scraper's secret-key environment, then require `failures=0`:

   ```sh
   cd scraper && uv run --env-file .env terpsdining-thumbnails
   ```

3. Deploy the thumbnail-enabled frontend.
4. Apply `20261007000000_prune_history.sql` before deploying the updated scraper. Without it, the pruning RPC returns 404 and the scrape job fails.
5. Apply `20261105000000_search_filters_rating_order.sql`, `20261107000000_merge_duplicate_items.sql`, and `20261111000000_offering_recipes.sql`, in that order, before deploying the frontend or scraper that use them. The frontend calls `search_items` with diet and allergen filters and reads `offerings.recipe_id`; the scraper calls `merge_items` and the new `replace_offerings`. After `20261111000000`, deploy the frontend promptly: its `offerings_recipe_id_fkey` makes the old frontend's hall menu query ambiguous.

See [scraper.md](scraper.md) for what each command does and what its output means.

## Hall metadata

Hall metadata lives in `src/lib/halls.ts`. Update it whenever a migration adds or renames a hall (hall rows are inserted in `supabase/migrations/20261003000000_init.sql`). Hall colors live in `hallTones` in `src/lib/theme.ts`.

The hall "Top rated" list uses Bayesian ranking within the selected meal and dietary/allergen filters.

## Policies

The hosted site publishes a [privacy policy](https://terpsdining.app/privacy) and [terms of use](https://terpsdining.app/terms). Questions and account-data requests go to **hello@shreyas.com**.

For independent deployments, review the policies and replace the contact details with your own before publishing.

## Forking checklist

Replace project-specific values before publishing your own copy:

- [ ] `SITE_URL` in `src/lib/seo.ts`.
- [ ] Social preview image `public/social.png`, and any site URL shown in it.
- [ ] Project ID in the `db:types` script in `package.json`.
- [ ] Contact address `hello@shreyas.com` in `src/pages/Privacy.tsx` and `src/pages/Terms.tsx`.
- [ ] Repository URL in the footer of `src/components/Layout.tsx`.
- [ ] Status page URL in the footer of `src/components/Layout.tsx`.
- [ ] Scraper `USER_AGENT` in `scraper/src/terpsdining_scraper/config.py`, which links to the repository.
- [ ] Hall metadata in `src/lib/halls.ts`, and `hallTones` in `src/lib/theme.ts`.
- [ ] Google consent-screen logo `docs/google-oauth-logo.png`, if you use your own branding.
- [ ] Scraper credentials, configured as GitHub Actions secrets for your own project.
- [ ] Repository URL in `package.json` (`repository.url`).
- [ ] Contact address in `README.md` and `docs/SECURITY.md`.
- [ ] Author name and email in `scraper/pyproject.toml`.
