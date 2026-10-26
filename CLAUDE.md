# CLAUDE.md --- MONIP Group Website Rebuild

## Project Mission

Build a modern, responsive, multi-page website for MONIP Group using a
custom Next.js + TypeScript frontend, Payload CMS, and Vercel
deployment.

The site must communicate MONIP's capabilities clearly, showcase product
samples, and let authorized MONIP staff manage products and content
without modifying application code.

## Read These Documents First

Before planning or changing the project, read:

1.  `REQUIREMENTS.md` --- source of truth for product and business
    requirements.
2.  `PLAN.md` --- implementation phases, architecture, data model, and
    acceptance workflow.

If instructions conflict, follow security and correctness first, then
`REQUIREMENTS.md`, then the approved decisions in `PLAN.md`. Update the
documents when a decision changes.

## Technology Baseline

-   Next.js App Router.
-   TypeScript with strict type checking.
-   Payload CMS (admin panel at `/admin`) with Postgres.
-   Vercel deployment.
-   Accessible, reusable UI components and a consistent design system.
-   Automated tests for critical behavior.

Inspect the repository before assuming its structure or replacing
configuration. If a repository or framework already exists, preserve
useful work and explain any proposed migration.

## Core Product Principles

-   Build a multi-page corporate website, not a single long landing
    page.
-   Use the CMS for business content and product records; use code for
    reusable layout and behavior.
-   Every published product should have a stable URL and a dedicated
    detail page.
-   Product cards, detail pages, and featured sections must derive from
    CMS content.
-   Make the CMS practical for nontechnical editors: clear labels,
    validation, sensible field groups, and editor instructions.
-   Only published content may appear in public listings, search, or the
    sitemap.
-   Keep internal supplier information, internal costs, private notes,
    tokens, and unpublished content out of public responses.
-   Product-specific inquiries must reference the product accurately.
-   Do not implement e-commerce, accounts, private client catalogs,
    quote automation, or CRM integrations unless approved.

## Required Engineering Practices

### Before coding

1.  Inspect the repository, package manager, existing scripts,
    environment setup, and current deployment assumptions.
2.  Read relevant project files and follow established conventions where
    reasonable.
3.  Identify dependencies and side effects before modifying
    configuration.
4.  For ambiguous business behavior, document the question and ask
    rather than inventing a rule.
5.  For a significant change, state the intended approach and affected
    files before proceeding.

### Code quality

-   Use TypeScript types; avoid `any` unless justified and isolated.
-   Keep components focused and reusable.
-   Separate CMS queries, schemas, validation, form delivery, and UI
    concerns.
-   Use server components by default; add client components only when
    interaction requires them.
-   Handle loading, empty, error, and not-found states appropriately.
-   Use semantic HTML and accessible form controls.
-   Keep copy and data separate from layout where the CMS should control
    content.
-   Avoid unnecessary dependencies and abstractions.
-   Do not leave broken links, dead buttons, fake functionality, or
    unexplained placeholder content.
-   Do not use hard-coded sample product content in production pages
    when CMS data should be used.

### Security and privacy

-   Never commit secrets or real credentials.
-   Never expose `PAYLOAD_SECRET`, database URLs, email provider keys, preview
    secrets, or private environment values to browser code.
-   Do not use `NEXT_PUBLIC_` for privileged secrets.
-   Validate form data on the server even if client validation exists.
-   Add appropriate spam mitigation and rate limiting for public forms.
-   Do not render untrusted CMS HTML unsafely.
-   Restrict preview/draft access and any write-capable CMS operations.
-   Do not log unnecessary personal information.
-   Do not claim a form was sent until the server/provider confirms
    acceptance.
-   Do not publish unsupported claims, confidential information, or
    client information without approval.

### CMS practices

-   Use explicit schemas for products, categories, services, success
    stories, and site settings.
-   Validate required fields and slug uniqueness.
-   Provide helpful field descriptions and sensible editor grouping.
-   Support ordered image galleries and meaningful alt text.
-   Keep confidential data out of public-facing schemas whenever
    possible.
-   Use narrowly scoped queries that request only the fields required by
    the page.
-   Keep draft/preview functionality separate from public content
    retrieval.
-   Do not hard-code CMS content in frontend templates as a substitute
    for real CMS integration.

### Design and content

-   Follow the approved MONIP brand assets and design tokens.
-   Make layouts responsive across mobile, tablet, and desktop.
-   Prioritize authentic, approved product imagery.
-   Do not alter product imagery in ways that misrepresent the actual
    sample.
-   Use clear, professional, business-oriented copy.
-   Do not invent clients, testimonials, performance metrics,
    certifications, sustainability claims, or product specifications.
-   If content is missing, use an explicit development placeholder and
    document what MONIP must provide; never let fake content reach
    production.

### SEO and performance

-   Use unique metadata for indexable pages.
-   Maintain canonical URLs, sitemap, robots configuration, and
    appropriate redirects.
-   Keep draft/private content out of indexing.
-   Optimize images and avoid unnecessary client-side JavaScript.
-   Use server rendering or static generation where appropriate.
-   Check performance and accessibility on representative pages.

## Expected Workflow

For each task:

1.  Read the relevant requirements and inspect the current
    implementation.
2.  Identify the smallest useful change and any assumptions.
3.  Implement the change without unrelated refactoring.
4.  Add or update tests for behavior that matters.
5.  Run the relevant formatter, linter, type checker, tests, and build.
6.  Review the diff for security, accessibility, responsive behavior,
    and accidental changes.
7.  Summarize what changed, what was tested, and any remaining decisions
    or blockers.
8.  Update `PLAN.md` or documentation when the implementation or
    decisions change.

Do not say tests, builds, deployments, or migrations succeeded unless
you actually ran them and reviewed the results.

## Working in Milestones

Follow the phase sequence in `PLAN.md`:

1.  Repository/environment inspection.
2.  Requirements and design foundation.
3.  Project setup and Payload configuration.
4.  Shared shell and core pages.
5.  Product catalog.
6.  Inquiry delivery.
7.  Content migration, SEO, and analytics.
8.  QA, deployment, and handover.

Prefer a vertical slice before broad implementation. For example,
complete the Product schema → CMS entry → query → catalog card → product
detail page → inquiry reference flow, then reuse the established
pattern.

Do not attempt a full rebuild in one massive, unreviewed change. Keep
changes reviewable and maintain a progress checklist.

## Environment and Setup

-   Document required variable names in `.env.example` with placeholder
    values only.
-   Keep local `.env` files out of source control.
-   Validate required environment variables where they are used.
-   Use the repository's existing package manager and lockfile.
-   Do not switch package managers without a clear reason.
-   Do not run destructive commands, delete content, reset
    databases/datasets, or overwrite production configuration without
    explicit authorization.
-   Do not deploy to production or alter DNS without explicit
    authorization and confirmed access.

## Definition of Done

A task is done only when it meets the applicable requirements, has
appropriate tests, passes relevant checks, does not expose secrets or
unpublished content, and has any necessary documentation updates.

For launch readiness, use the acceptance criteria in `REQUIREMENTS.md`
and the QA/deployment checklists in `PLAN.md`.

## When Blocked

If credentials, content, access, or a business decision is missing:

-   Continue with independent work where safe.
-   Use clearly identified local placeholders only for development.
-   Record the missing input and its impact.
-   Ask a focused question when the decision blocks a meaningful next
    step.
-   Never fabricate credentials, contact details, client claims, or
    product data.

## Project-Specific Notes

-   Current state, decisions, and next steps live in `PLAN.md`
    (sections 10, 12, 13). A temporary deployment runs at
    https://monip-group.vercel.app (Vercel team `monip`); no custom
    domain or DNS changes without authorization.
-   Public queries use Payload's Local API with `overrideAccess: false`
    (the Local API skips access control by default).
-   Restart `pnpm dev` after changing `payload.config.ts` or collections;
    the running server keeps the old config.
-   After a collection change, run `pnpm payload migrate:create <name>`
    and verify a fresh database built from migrations matches the dev
    schema.
-   Run e2e tests with `pnpm test:e2e` (production build on port 3100);
    do not stop a developer's `pnpm dev` on port 3000.
-   Production servers rename themselves `next-server`; stop them by port
    (`lsof -t -iTCP:<port> -sTCP:LISTEN`), not by `pkill -f "next start"`.
-   The shell is zsh: unquoted `$VAR` lists are not word-split (use
    `${=VAR}`), and unmatched globs abort the command.
-   Delete any test users, inquiries, or drafts created while verifying
    behavior; the first real account must become the admin.
-   E2E tests share the development database, which now holds real
    content; delete `e2e-*@example.com` inquiries after each run, and
    expect catalog tests to fail where editors replaced placeholders.
-   The chat calls OpenRouter only from `app/api/chat`; tests mock it.
    Never log or expose `OPENROUTER_API_KEY`.
-   For admin-only checks, `pnpm payload run scripts/e2e-users.ts create
    <password>` makes `e2e-admin@example.com` and `e2e-editor@example.com`;
    run it with `delete` afterwards (the Cruise Fleet Schedule e2e tests
    do both).
-   In development, `payload run` scripts sync the schema before running,
    so hand-made constraints vanish; use `NODE_ENV=production` to avoid it.
-   Cruise sailings are commercially sensitive: keep them admin-only and
    out of public pages, search, the sitemap, and the chat.
