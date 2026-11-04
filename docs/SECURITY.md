# Security policy

## Supported versions

Security fixes apply to the `main` branch and to the production site at https://terpsdining.app.

## Reporting a vulnerability

Report vulnerabilities privately by email to **hello@shreyas.com** with the subject line "Security". Do not open a public GitHub issue or pull request for a suspected vulnerability.

Include:

- A description of the issue and its impact.
- Steps to reproduce, or a proof of concept.
- The affected page, file, or workflow, and the commit if you know it.

We aim to acknowledge reports within 7 days and will keep you informed while we investigate. Please give us a reasonable chance to fix the issue before disclosing it publicly.

Do not include passwords, authentication tokens, or other people's personal data in a report.

## Scope

In scope:

- The TerpsDining web application and its prerendered pages.
- Supabase row-level security policies and functions in `supabase/migrations/`.
- The scraper in `scraper/`.
- GitHub Actions workflows in `.github/workflows/`.

Out of scope:

- UMD Dining and other UMD-owned websites and data sources.
- Third-party providers (for example Supabase, Vercel, Google, and GitHub) themselves. Report problems in their products to the provider.
- Reports that rely on social engineering, physical attacks, or denial-of-service testing against production services.
