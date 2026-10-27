# MONIP Group website

Next.js 16 + Payload CMS 3 (Postgres). A temporary, non-indexed deployment runs at https://monip-group.vercel.app; there is no custom domain yet.
See `REQUIREMENTS.md`, `PLAN.md` (decisions, progress, next steps), and `Editor_guide_for_MONIP.md` (for content editors).

## Local setup

Requires Node.js >= 24.22.1, pnpm, and Docker Desktop.

```bash
cp .env.example .env        # then set PAYLOAD_SECRET (openssl rand -hex 32)
pnpm install
pnpm db:up                  # local Postgres in Docker
pnpm dev                    # http://localhost:3000, admin at /admin
pnpm seed                   # optional: placeholder products, services, and pages (dev only)
```

- The first account created at `/admin` becomes an admin.
- Without `RESEND_API_KEY`, emails are printed to the `pnpm dev` console.
- The website chat ("Chat with us") needs `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in `.env`; without them it shows "not available".
- Restart `pnpm dev` after changing `payload.config.ts` or a collection; Payload reads its config at startup.
- Live Preview (eye icon in the admin) needs `SITE_URL` to match the address the site is served from.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | Browser and accessibility tests (Playwright + axe) against a production build on port 3100; runs alongside `pnpm dev`; uses the local DB and expects the seeded placeholders (the chat is mocked); creates and then deletes `e2e-admin@example.com` and `e2e-editor@example.com` (or a per-spec set, e.g. `e2e-training-admin@example.com`) |
| `pnpm seed` | Placeholder content; skips anything that already exists |
| `pnpm import:sailings "<file.xlsx>"` | Import the workbook's Sailings sheet into the admin-only Cruise Fleet Schedule, as the admin **Import Excel** button does (use the script for workbooks over its 4 MB limit); updates matching sailings (Ship + Start date), adds new ones, keeps the rest, and lists rejected rows |
| `pnpm generate:types` / `generate:importmap` | Regenerate Payload types / admin import map |
| `pnpm payload migrate:create <name>` | Create a migration after changing collections |
| `pnpm db:up` / `pnpm db:down` | Start / stop local Postgres |

## Database changes

In development Payload syncs the schema automatically. After changing a collection, run `pnpm payload migrate:create <name>` and commit the file in `migrations/`. Deployments run pending migrations before building (`deploy:build`, set in `vercel.json`).

## Deploying to Vercel (when approved)

1. Create a Neon Postgres database and a Vercel Blob store, and connect both to the Vercel project.
2. Set environment variables for Production (and Preview, with a separate database):
   `DATABASE_URL`, `PAYLOAD_SECRET`, `SITE_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`, `INQUIRY_NOTIFY_EMAIL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`.
3. Deploy. Preview deployments are never indexed by search engines.

Before launch: add rate limiting for the inquiry form and chat (Vercel Firewall rules on `POST` to product and contact pages and to `/api/chat`), and set a spending limit on the OpenRouter key.
