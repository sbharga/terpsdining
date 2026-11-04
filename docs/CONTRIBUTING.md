# Contributing

Thanks for helping improve TerpsDining. This guide covers the workflow; the [README](../README.md#quick-start) covers local setup, and [AGENTS.md](../AGENTS.md) lists commands and conventions in more detail.

## Setup

Follow the [README quick start](../README.md#quick-start). The scraper is optional; see [scraper.md](scraper.md) for its setup.

## Workflow

1. Fork the repository and create a branch from `main`.
2. Make a focused change. Keep unrelated cleanup out of the same pull request.
3. Open a pull request against `main`. Describe what changed and why, and how you checked it.

## Required checks

Run these before opening a pull request:

```sh
bun run lint
bun run typecheck
bun run test
bun run build
```

If you changed the scraper, also run these from `scraper/`:

```sh
uv run --frozen ruff check
uv run --frozen pytest
```

CI runs the same commands on every push and pull request.

## Guidelines

- **UI changes** follow [design.md](design.md). Reuse the existing primitives and recipes instead of adding new styles. Attach screenshots at 390px wide and at desktop width, and include dark mode when the change affects color.
- **Database changes** are new timestamped files in `supabase/migrations/`. Never edit a migration that has already been applied. Regenerate the types with `bun run db:types`.
- **Scraper changes** need tests that use saved fixtures in `scraper/tests/fixtures/`. Tests must not call the live UMD sites or Supabase.
- **Secrets** never belong in source, in commits, or in `VITE_` variables. Keep `.env*` files local.
- **Documentation** that describes behavior, commands, or configuration is updated in the same pull request.

## Commit messages

Write one imperative sentence that summarizes the change, such as "Show home hours as per-hall meal lists".

## Questions

Open a GitHub issue for questions about the code, the design, or the project. For security problems, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
