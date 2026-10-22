# MONIP Group website

Next.js 16 + Payload CMS 3 (Postgres), deployed on Vercel. See `REQUIREMENTS.md` and `PLAN.md`.

## Local setup

Requires Node.js >= 24.22.1, pnpm, and Docker.

```bash
cp .env.example .env        # then set PAYLOAD_SECRET (openssl rand -hex 32)
pnpm install
pnpm db:up                  # local Postgres in Docker
pnpm dev                    # http://localhost:3000, admin at /admin
pnpm seed                   # optional: placeholder products (dev only)
```

The first account created at `/admin` becomes an admin. Without `RESEND_API_KEY`, emails are printed to the console.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | Browser tests (Playwright, system Chrome; needs seeded local DB) |
| `pnpm generate:types` / `generate:importmap` | Regenerate Payload types / admin import map |
| `pnpm payload migrate:create <name>` | Create a migration after changing collections |

## Database changes

In development Payload syncs the schema automatically. Before deploying a collection change, run `pnpm payload migrate:create <name>` and commit the file in `migrations/`. Deployments run pending migrations before building (`deploy:build`, set in `vercel.json`).

## Deploying to Vercel

1. Create a Neon Postgres database and a Vercel Blob store, and connect both to the Vercel project.
2. Set environment variables for Production (and Preview, with a separate database):
   `DATABASE_URL`, `PAYLOAD_SECRET`, `SITE_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`, `INQUIRY_NOTIFY_EMAIL`.
3. Deploy. Preview deployments are never indexed by search engines.

Before launch: add rate limiting for the inquiry form (Vercel Firewall rule on `POST` to product and contact pages).
