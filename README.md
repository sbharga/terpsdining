# TerpsDining

[Visit TerpsDining](https://terpsdining.vercel.app)

Menus, hours, nutrition, and ratings for the University of Maryland’s three dining halls: South Campus, Yahentamitsi, and 251 North.

## Features

- Daily menus organized by dining hall, meal, and station.
- Dietary and allergen filters, with links to official nutrition labels.
- Food search, ingredients, nutrition facts, and serving history.
- Availability across multiple dining halls on the same day.
- Google sign-in and one editable 1–5 star rating per user per item.

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

Dining hours and menus come from the public sources documented in [DATA.md](DATA.md). The scraper downloads nutrition labels and stores resized food images in Supabase Storage.

For an independently configured database, provide `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in the ignored `scraper/.env` file:

```sh
cd scraper
uv sync --frozen
uv run --env-file .env terpsdining-scrape --image-limit 10
```

Options include `--date YYYY-MM-DD`, `--days N`, `--skip-images`, and `--skip-hours`. A failed menu request preserves existing offerings for that slot; a successful empty menu clears it. Offerings preserve separate halls, meals, and stations for the same item.

The daily GitHub Actions workflow supports scheduled and manual runs. Independent deployments must supply their own scraper credentials through GitHub Actions secrets, never through source files.

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

Prerendered content and sitemap entries refresh on deployment; the browser fetches live data. Newly scraped items remain accessible before the next deployment, but require a rebuild for initial HTML and sitemap inclusion. Search engines determine indexing and rankings.

## Privacy and terms

Read the [privacy policy](https://terpsdining.vercel.app/privacy) and [terms of use](https://terpsdining.vercel.app/terms). Questions and account-data requests: **support@docet.org**.

For independent deployments, review the policies and replace the contact details with your own before publishing.
