# TerpsDining

[Visit TerpsDining](https://terpsdining.vercel.app)

Menus, hours, nutrition, and ratings for the University of Maryland’s three dining halls: South Campus, Yahentamitsi, and 251 North.

## Features

- Daily menus organized by dining hall, meal, and station.
- Dietary and allergen filters, with links to official nutrition labels.
- Paginated food search, ingredients, nutrition facts, and serving history; every matching item is reachable.
- Availability across multiple dining halls on the same day.
- Google sign-in and one editable 1–5 star rating per user per item.
- Solid fresh food market colors, flat rounded cards, OS-following dark mode, and self-hosted Inter and Bricolage Grotesque fonts.
- Keyboard skip link, date reset controls, clearable filters, and reduced-motion support.
- Average-rating pills use red below 3, amber from 3 to under 4, and green from 4 to 5; the numeric score remains visible.
- Text-only not-found page with a link back to today's menu; no fork-and-knife icons.

Dates and hours use America/New_York. Food images are illustrative, not official dining hall photos.

**TerpsDining is an independent project and is not affiliated with UMD.** Menus and hours can change. Confirm allergens, ingredients, and cross-contact risks with dining staff before eating; filters do not establish that food is safe for an allergy.

## Development

The frontend uses React, TypeScript, Tailwind, Vite, bun, and Supabase. The scraper uses Python 3.13 with uv.

```sh
bun install --frozen-lockfile
```

Copy `.env.example` to `.env.local` and supply a Supabase URL and **publishable** key for a project using the schema in `supabase/migrations/`:

```dotenv
VITE_SUPABASE_URL=<Supabase project URL>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

```sh
bun run dev
```

Open `http://localhost:5173`.

For your own deployment, apply the migrations to your own Supabase project and configure Google OAuth there. The authorized Google callback is your Supabase project's `/auth/v1/callback` URL; Supabase's redirect allowlist must include your frontend URL. The checked-in `db:types` script targets the maintained project's schema; change its project ID before using it for another project.

Never commit credentials or place a Supabase secret key or Google client secret in a `VITE_` variable. The frontend and prerender build need only the publishable key. Environment files are ignored by Git.

## Data collection

Dining hours and menus come from the public sources documented in [DATA.md](DATA.md). The scraper stores 480px WebP food images in Supabase Storage and 160px card thumbnails under `thumbs/`.

For an independently configured database, provide `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the ignored `scraper/.env` file:

```sh
cd scraper
uv sync --frozen
uv run --env-file .env terpsdining-scrape --image-limit 10
```

Options include `--date YYYY-MM-DD`, `--days N`, `--skip-images`, and `--skip-hours`. A failed menu request preserves existing offerings for that slot; a successful empty menu clears it. Offerings preserve separate halls, meals, and stations for the same item.

The daily GitHub Actions workflow supports scheduled and manual runs. Independent deployments must supply their own scraper credentials through GitHub Actions secrets, never through source files.

Set the GitHub Actions secret `VERCEL_DEPLOY_HOOK_URL` to a Vercel Deploy Hook for the production branch. The workflow requests a rebuild after each scrape, including partial menu failures; without the secret, the rebuild step is skipped.

## Build and checks

```sh
bun run lint
bun run typecheck
bun run test
bun run build
```

```sh
cd scraper
uv run --frozen ruff check
uv run --frozen pytest
```

The build fetches public Supabase data and prerenders pages into `dist/`. It requires the frontend environment variables and network access. Data-fetch errors fail the build rather than generate empty pages.

## Deployment and indexing

On Vercel, use the Vite preset, repository root, install command `bun install --frozen-lockfile`, build command `bun run build`, and output directory `dist`. Configure the frontend environment variables for the deployment.

Pages have route-specific metadata, canonical URLs, social previews, and initial HTML content. `/sitemap.xml` lists indexable pages; `/robots.txt` advertises it. Search and missing pages are marked `noindex`. Canonicals omit query parameters. If deploying this code to a different website, update the production origin in `src/lib/seo.ts` and the URL in the social-preview artwork.

Prerendered content and sitemap entries refresh on deployment. Public query data is embedded in each menu, hours, and item page and restored before the first client render. Fresh queries do not immediately refetch: hours and history stay fresh for six hours, menus for 30 minutes, and other queries for five minutes. Newly scraped items remain accessible before the next deployment, but require a rebuild for initial HTML and sitemap inclusion. Search engines determine indexing and rankings.

Deploy the paginated-search/history migration before the frontend, then backfill existing card thumbnails using the scraper's secret-key environment:

```sh
cd scraper && uv run --env-file .env terpsdining-thumbnails
```

Require `failures=0` before deploying the thumbnail-enabled frontend. Hashed `/assets/` files have a one-year immutable cache policy; food objects use a seven-day cache policy. Only the Latin subsets of the two fonts are shipped.

Hall metadata lives in `src/lib/halls.ts`; update it whenever the database seed adds or renames a hall. Hall “Top rated” uses Bayesian ranking within the selected meal and dietary/allergen filters.

## Privacy and terms

Read the [privacy policy](https://terpsdining.vercel.app/privacy) and [terms of use](https://terpsdining.vercel.app/terms). Questions and account-data requests: **support@docet.org**.

For independent deployments, review the policies and replace the contact details with your own before publishing.
