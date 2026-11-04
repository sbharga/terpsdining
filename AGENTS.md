# AGENTS.md

TerpsDining is a React + Vite site (Supabase backend, prerendered pages) for UMD dining menus, hours, nutrition, and ratings. A Python scraper in `scraper/` fills the database.

## Commands

Frontend, from the repository root (Bun):

- Install: `bun install --frozen-lockfile`
- Dev server: `bun run dev`
- Checks: `bun run lint`, `bun run typecheck`, `bun run test`
- Build and prerender: `bun run build` (needs `.env.local` and network access)

Scraper, from `scraper/` (Python 3.13, uv):

- Install: `uv sync --frozen`
- Checks: `uv run --frozen ruff check`, `uv run --frozen pytest`
- Run: `uv run --env-file .env terpsdining-scrape` (see `docs/scraper.md` for options)

## Layout

- `src/pages/`: route pages, default exports.
- `src/components/UI.tsx`: shared primitives, named exports. `Layout.tsx` is the app shell.
- `src/lib/theme.ts`: class recipes (`buttonClass`, `cardClass`, `titleClass`, `overlineClass`, `linkClass`), the `tones` palette with `hallTone()`, `mealTones`, `dietTone()`, and `nameTone()`, and the only home of raw Tailwind palette classes.
- `src/lib/*`: pure logic, with colocated `*.test.ts` files.
- `src/api/queries.ts`: React Query data access.
- `src/index.css`: design tokens.
- `scripts/prerender.tsx`: prerenders pages into `dist/`. `scripts/check-design.ts`: design-token guard run by `lint`.
- `scraper/src/terpsdining_scraper/`: scraper modules. `scraper/tests/`: pytest tests and `fixtures/`.
- `supabase/migrations/`: database schema, applied in filename order.
- `docs/`: design, data sources, scraper, deployment, contributing, and security docs.

## Code conventions

- TypeScript: no semicolons, single quotes, 2-space indent. Pages use default exports; components use named exports. Dense single-line JSX is fine.
- Python: follow `ruff` as configured in `scraper/`.
- Dates and times are America/New_York. Use `src/lib/dates.ts` in the frontend and `TZ` in `scraper/src/terpsdining_scraper/config.py` in the scraper.
- Pages are prerendered and then hydrated, so render output must be deterministic. Do not read `window`, `localStorage`, or the clock in render paths that affect markup; read them in effects.
- Database changes go in a new timestamped file in `supabase/migrations/` (`YYYYMMDDHHMMSS_name.sql`). Never edit a migration that has been applied. After a schema change, run `bun run db:types`.
- Never hand-edit `src/lib/database.types.ts`.
- `src/lib/halls.ts` must match the hall rows in the database seed. A new hall also needs an entry in `hallTones` in `src/lib/theme.ts`.

## UI rules

- Follow `docs/design.md`. Reuse the primitives in `UI.tsx` and the recipes in `theme.ts`; do not add a second way to build a button, card, or heading.
- Do not use raw palette classes (for example `bg-red-500`) outside `src/lib/theme.ts`. `bun run lint` fails on them. Use tokens from `src/index.css` or tones from `theme.ts`.
- Interactive targets are at least 44×44px (`h-11`, or `h-9` with the `hit` utility).
- Check changes at 360–390px width, on desktop, and in light and dark mode.

## Testing

- Unit tests for `src/lib` logic use Vitest and sit next to the module as `*.test.ts`.
- Scraper tests use pytest with saved HTML and text fixtures in `scraper/tests/fixtures/`.
- Tests must not use the network. Never test against the live UMD sites or Supabase.

## Safety

- Never commit `.env*` files. Only `.env.example` files are tracked.
- Never put a Supabase secret key, Google client secret, or deploy hook URL in a `VITE_` variable or in source.
- Do not edit `dist/` by hand.
- The scraper must stay polite to nutrition.umd.edu: keep its identifying `USER_AGENT`, keep request concurrency bounded, and keep the delays between image searches. Do not raise concurrency or remove delays without a reason.

## Done checklist

- Frontend changes: `bun run lint`, `bun run typecheck`, and `bun run test` pass. Run `bun run build` when routes, data loading, or prerendering change.
- Scraper changes: `uv run --frozen ruff check` and `uv run --frozen pytest` pass.
- Behavior, commands, or configuration changed: update the affected README or `docs/` pages in the same change.
- UI changes: checked at mobile and desktop widths, in light and dark mode.

## Commit messages

Write one imperative sentence that summarizes the change, in the style of the existing history (for example, "Show home hours as per-hall meal lists").
