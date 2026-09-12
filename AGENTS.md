# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

`Balance` is a bilingual personal and household finance app for individual and shared wallets. It uses Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Auth/Postgres/RLS, optional Redis caching, and Docker deployment. Product areas include budgets with salary-period support, recurring transactions, savings and debts, AI chat and insights, receipt scanning, subscriptions, reports, and PWA features. Treat code and current product docs as the source for feature details; keep this overview short.

## Documentation: Know When to Read

**Small fix ≠ read-everything.** Match the reading effort to the task. Guessing wrong is worse than reading slow.

| Tier | When | What to read |
|------|------|-------------|
| **Quick** | Typo, rename, comment, config tweak, single-line fix | The file you're touching. Skip the docs. |
| **Deep** | New feature, DB schema change, new UI, new API, architecture change | The relevant doc below + the files. |

**If you're unsure which tier it is, read the doc.** Wrong assumptions cost more than extra tokens.

### Per-task reading map

| If the task touches… | Read… |
|----------------------|-------|
| **Database schema, RLS, migrations** | `docs/DB_SCHEMA.md` — all tables, policies, data flows, migration history |
| **Server actions, form mutations** | `docs/SERVER_ACTION_PATTERNS.md` — patterns, error handling, revalidation |
| **UI, CSS, components, design** | `DESIGN.md` — Serene Capital tokens; Light + Dark mode are both first-class |
| **API, chat endpoints, integration** | `docs/API_REFERENCE.md` — auth, endpoints, rate limits, Cloudflare notes |
| **Product features, user flows** | `docs/PRD.md` — feature status, user flows, limitations |
| **Architecture, routing, data layer** | `docs/ENGINEERING.md` — stack, directories, deployment |
| **Testing** | `docs/TESTING_GUIDE.md` — Vitest setup, patterns, what to test |
| **Debugging errors** | `docs/TROUBLESHOOTING.md` — common errors + solutions |
| **Plan/roadmap** | `docs/plans/PLAN.md` — vision, scope, upgrade path |
| **Setup, Docker, env vars** | `README.md` — hosted/self-hosted Supabase, migrations, deployment |

For an initial orientation, read `docs/AGENT_QUICKSTART.md` once per session — it covers the golden rules and architecture in 5 minutes.

## Common Commands

- Install the locked dependencies: `npm ci`
- Start development server: `npm run dev`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Run unit tests: `npm run test`
- Build production app: `npm run build`
- Run recurring scheduler locally: `npm run scheduler:recurring`
- Start production Docker stack: `docker compose up --build -d`
- Start self-hosted Supabase/local infra stack: `docker compose -f docker-compose.self-hosted.yml up --build`

For code changes, run `npm run lint`, `npm run typecheck`, and `npm run test`; run `npm run build` when changes affect routing, rendering, environment handling, dependencies, or deployment. CI uses lint → typecheck → test → build; `.github/workflows/ci.yml` is the source of truth if this sequence changes. Exact package versions and scripts live in `package.json` and `package-lock.json`.

## Architecture Map

- `proxy.ts` handles locale redirects, Supabase session refresh, and the route auth boundary.
- `app/[locale]/` contains localized pages and layouts; `app/actions/` contains UI mutations and shared action helpers.
- `app/api/` contains HTTP endpoints for AI, chat integrations, PDF reports, Midtrans notifications, health checks, and PWA keys. Route handlers remain appropriate for webhooks, streaming, external integrations, and downloads.
- `components/` contains reusable UI and feature components; `app/globals.css` defines global styles and theme tokens.
- `messages/id.json`, `messages/en.json`, and `lib/i18n.ts` define the two supported locales and translation helpers.
- `lib/data/` is the read-model layer: `queries.ts` reads Supabase, `mappers.ts` maps rows to view models, `index.ts` composes page loaders, and `cache.ts` defines Redis keys, TTLs, and invalidation.
- `lib/supabase/` contains server, browser, and admin clients; `lib/auth.ts` contains shared auth helpers.
- `lib/ai/`, `lib/midtrans/`, `lib/pdf/`, and `lib/push-helper.ts` hold AI, payment, report, and push-notification logic.
- `supabase/migrations/` is the ordered database change history.
- `tests/unit/` covers business logic and selected integrations; `scripts/run-recurring-scheduler.mjs` runs recurring transaction generation outside the web request path.

## Coding Conventions

- Use TypeScript in strict mode. Avoid `any` unless there is no practical alternative.
- Use double quotes and semicolons, matching the existing codebase.
- Prefer the `@/` import alias for app, component, and lib imports.
- Keep server-only logic guarded with `import "server-only"` where appropriate.
- Prefer async Server Components for authenticated pages, calling `requireUser()` before loading protected data.
- Keep form mutations as server actions with `"use server"` at the top of the file.
- Use `redirectToWalletSection`, `redirectWithMessage`, and `revalidateWalletPaths` instead of ad hoc redirect/revalidation logic.
- Keep pure calculations in `lib/*` or `lib/data/mappers.ts` so they can be unit tested without Supabase.
- Do not edit generated files such as `next-env.d.ts`, `.next/`, `tsconfig.tsbuildinfo`, or `node_modules/`.

## Data, Auth, and Cache Rules

- Supabase RLS is part of the security model. Do not bypass it from user-facing code unless the change explicitly needs an admin/server key path.
- **Blanket GRANT risk:** Migration 0001 applies `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES ... TO authenticated`.
  This means **any table without RLS enabled is publicly writable/readable by all authenticated users.**
  When adding a new table: (1) always run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`,
  (2) create at least one RLS policy before any data is inserted,
  (3) verify with `SELECT relname FROM pg_class WHERE relrowsecurity = false;`.
- Keep `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose secret keys through browser components, public env vars, logs, or rendered markup.
- When adding or changing database tables, policies, RPCs, or triggers, add a new SQL migration in `supabase/migrations/`. Do not rewrite old migrations unless the user explicitly asks.
- Wallet-scoped reads should validate membership before returning data.
- Mutations that affect wallet-visible data should invalidate Redis read caches with `invalidateWalletReadCaches(...)` and revalidate the relevant Next paths.
- Shared wallet mutations can affect multiple users' dashboards; use the existing dashboard invalidation pattern unless you have a more precise member-aware strategy.
- Redis is best-effort. Features must continue to work when `REDIS_ENABLED=false` or `REDIS_URL` is missing.

## UI and Product Guidelines

- Put user-facing copy behind `lib/i18n.ts` using `messages/id.json` and `messages/en.json`. Add or update both locales for changed copy, keeping translation keys and placeholders aligned; do not rely on the fallback for intentionally supported UI text.
- Preserve the calm "Serene Capital" visual language from `DESIGN.md`: cream surfaces, sage/forest accents, generous whitespace, rounded cards, soft shadows, and tabular numeric displays.
- The UI supports **two rendered themes: Light Mode and Dark Mode**. Treat both as first-class surfaces for every user-facing change. The `system` preference only selects between these two applied themes.
- Prefer existing UI primitives in `components/ui/` and shared classes from `app/globals.css` (`card`, `headline-*`, `metric`, `page-wrap`, `data-grid`, etc.).
- Prefer semantic theme tokens and existing shared classes over hardcoded colors so contrast, hover states, overlays, charts, and focus states remain correct in both themes.
- Ensure all finance values use existing formatting helpers such as `formatCurrency`.
- Keep layouts mobile-responsive first, then enhance with Tailwind breakpoints.
- Avoid introducing unrelated design systems, icon packs, animation libraries, or CSS frameworks unless the user explicitly wants them.

## Testing Guidance

- Add or update unit tests for pure helpers, mappers, recurring logic, cache behavior, date math, and permission-sensitive branching.
- Prefer deterministic tests that do not require a live Supabase instance.
- Use the existing Vitest setup. The `server-only` package is aliased to `tests/support/server-only.ts`. For code changes, follow the CI checks: `npm run lint`, `npm run typecheck`, and `npm run test`; build when the changed area warrants it. For documentation-only work, verify paths, commands, versions, routes, and migrations against the repository instead.
- If a change cannot be fully verified locally because it needs Supabase, Docker, SMTP, or Redis, state that clearly in the handoff and explain what was verified instead.

## Environment and Deployment Notes

- Copy `.env.example` to `.env` for local work.
- Hosted Supabase and self-hosted Supabase are both supported. Keep env var compatibility noted in `README.md`.
- `docker-compose.yml` builds the app and recurring scheduler, then serves through Caddy.
- `docker-compose.self-hosted.yml` is for the larger local/self-hosted Supabase stack, including Mailpit for email testing.
- The Dockerfile uses Next standalone output and Node 22 Alpine. Be careful with dependencies that need native build tooling.
- ARM64 is the expected production platform by default through `DOCKER_PLATFORM=linux/arm64`.

## Agent Workflow

### 1. Classify the task

- **Quick?** (typo, rename, comment, config) → inspect the file and make the focused change.
- **Deep?** (feature, DB, UI, API, architecture) → read the relevant doc from the [map above](#per-task-reading-map), then inspect the implementation.
- **Unsure?** → read the relevant doc and source. Repository docs can lag behind code.

### 2. Understand before editing

- Check the current implementation and configuration; do not rely on framework-default assumptions or stale examples.
- For database changes, read `docs/DB_SCHEMA.md` and the latest migration in `supabase/migrations/`.
- For UI changes, open `DESIGN.md` and check both Light and Dark mode.
- For server actions, follow `docs/SERVER_ACTION_PATTERNS.md` and the specific action's authorization pattern.

### 3. Make changes

- Keep edits focused and consistent with the existing architecture.
- Do not revert or edit unrelated user work.
- Do not edit old migrations; add a new migration for schema changes.
- Do not edit generated files such as `next-env.d.ts`, `.next/`, `tsconfig.tsbuildinfo`, or `node_modules/`.

### 4. Verify

- Code: run lint, typecheck, and tests; also build when routing, rendering, environment, dependency, or deployment behavior is affected.
- Documentation: check links and verify commands, versions, routes, and schema claims against source files.
- If a check needs Supabase, Docker, SMTP, Redis, or a provider that is unavailable, state what could not run and what was verified instead.

### 5. Handoff

- Update the root `CHANGELOG.md` for user-visible product changes when appropriate; update `lib/changelogs.ts` for product features that belong in the in-app changelog. Documentation-only and maintenance changes do not need a user-facing changelog entry.
- Summarize the change, checks run, and any remaining limits.
