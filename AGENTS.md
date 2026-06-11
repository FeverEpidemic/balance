# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

`balance` is a mobile-responsive household finance MVP in Bahasa Indonesia. It is built with Next.js App Router, React, TypeScript, Tailwind CSS, Supabase Auth/Postgres/RLS, optional Redis read caching, and Docker deployment support.

Use these docs as source-of-truth context before broad changes:

- `README.md` for setup, hosted/self-hosted Supabase notes, Docker usage, and operational details.
- `docs/plans/PLAN.md` for product scope.
- `DESIGN.md` for the "Serene Capital" visual direction, tokens, typography, and UI tone.
- `CHANGELOG.md` for recent feature history.
- `supabase/migrations/` for database shape and RLS behavior.

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

- Check docs folder first to understand the repo and project
- Inspect the relevant files before editing; do not rely on assumptions from framework defaults.
- Make focused changes that fit the existing architecture rather than introducing new abstractions early.
- Preserve unrelated user work in the git tree. Do not revert files unless explicitly instructed.
- Before large behavioral changes, check the migrations, data loaders, server actions, and tests together so database, cache, and UI stay aligned.
- After making changes to the project, update `CHANGELOG.md` with the relevant entry.
- When adding or changing user-facing product features, also update `lib/changelogs.ts` with a newest-first feature changelog entry so the in-app `/changelogs` page and "What's New" popup stay current. Do not add purely internal refactors, dependency bumps, or invisible code-only maintenance unless they materially affect users.
- After changes, summarize what changed, what was verified, and any residual risks or follow-up work.
