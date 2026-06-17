# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

`balance` is a mobile-responsive household finance MVP in Bahasa Indonesia. It is built with Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Auth/Postgres/RLS, optional Redis read caching, and Docker deployment support.

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

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Type-check: `npm run typecheck`
- Run unit tests: `npm run test` or `npm run test:unit`
- Build production app: `npm run build`
- Run recurring scheduler locally: `npm run scheduler:recurring`
- Start production Docker stack: `docker compose up --build -d`
- Start self-hosted Supabase/local infra stack: `docker compose -f docker-compose.self-hosted.yml up --build`

Prefer `npm run typecheck` and `npm run test` before handing off code changes. For changes touching routing, SSR, env handling, or Docker output, also run `npm run build` when feasible.

## Architecture Map

- `app/` contains Next App Router pages, route handlers, global CSS, and server actions.
- `app/actions/` contains server mutations. Keep shared form parsing, redirects, and revalidation helpers in `app/actions/_shared.ts`.
- `components/` contains reusable UI and feature-level client/server components.
- `lib/data/` is the main read-model layer:
  - `queries.ts` talks to Supabase.
  - `mappers.ts` converts database rows into UI-ready view models.
  - `index.ts` composes reads, React cache, Redis cache, and page data loaders.
  - `cache.ts` defines Redis cache keys, TTLs, and invalidation helpers.
- `lib/supabase/` contains server, browser, and admin Supabase clients.
- `lib/auth.ts` handles authenticated user requirements and profile bootstrapping.
- `lib/finance.ts`, `lib/recurring.ts`, and `lib/utils.ts` hold business/date/currency helpers.
- `tests/unit/` covers pure business logic and cache behavior with Vitest.
- `scripts/run-recurring-scheduler.mjs` runs recurring transaction generation outside the web request path.

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
- Keep `SUPABASE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose secret keys through browser components, public env vars, logs, or rendered markup.
- When adding or changing database tables, policies, RPCs, or triggers, add a new SQL migration in `supabase/migrations/`. Do not rewrite old migrations unless the user explicitly asks.
- Wallet-scoped reads should validate membership before returning data.
- Mutations that affect wallet-visible data should invalidate Redis read caches with `invalidateWalletReadCaches(...)` and revalidate the relevant Next paths.
- Shared wallet mutations can affect multiple users' dashboards; use the existing dashboard invalidation pattern unless you have a more precise member-aware strategy.
- Redis is best-effort. Features must continue to work when `REDIS_ENABLED=false` or `REDIS_URL` is missing.

## UI and Product Guidelines

- Keep user-facing copy in Bahasa Indonesia unless the surrounding surface is already English or operational.
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
- Use the existing Vitest setup. The `server-only` package is aliased to `tests/support/server-only.ts`.
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

- **Quick?** (typo, rename, comment, config) → read the file, make the change.
- **Deep?** (feature, DB, UI, API, architecture) → read the relevant doc from the [map above](#per-task-reading-map), then inspect the files.
- **Unsure?** → treat as Deep. Guessing is always more expensive than reading.

### 2. Understand before editing

- Inspect the relevant files. Do not rely on framework-default assumptions.
- For database changes: read the latest migration + `docs/DB_SCHEMA.md`.
- For UI changes: open `DESIGN.md` + check both Light and Dark mode.
- For server actions: follow `docs/SERVER_ACTION_PATTERNS.md` exactly.

### 3. Make changes

- Focused edits that fit existing architecture. No premature abstractions.
- Do NOT revert or edit unrelated user work unless explicitly asked.
- Do NOT edit old migrations — add a new one.
- Do NOT edit generated files (`next-env.d.ts`, `.next/`, `node_modules/`).

### 4. Verify

- `npm run typecheck` → zero errors
- `npm run test` → all passing
- For routing/SSR/env/Docker changes: also `npm run build`
- If Supabase/Docker/SMTP/Redis is needed but unavailable, state it clearly.

### 5. Handoff

- Update `CHANGELOG.md` with changes.
- If user-facing feature: also update `lib/changelogs.ts`.
- Summarize: what changed, what was verified, residual risks.
