---
title: Balance — Engineering Architecture
version: 1.2.0
last_updated: 2026-09-13
stack: Next.js 16 · React 19 · TypeScript 5.8 · Tailwind CSS 4 · Supabase · Redis
---

# Balance — Engineering Architecture

> Arsitektur teknis lengkap: stack, routing, data layer, server actions, komponen, deployment.
> Dokumen ini dibuat untuk dibaca oleh AI agent maupun manusia.

---

## 1. Tech Stack

| Layer | Teknologi | Versi/range |
|-------|-----------|-------------|
| **Framework** | Next.js (App Router) | ^16.2.9 |
| **UI Library** | React | ^19.2.7 |
| **Bahasa** | TypeScript (strict) | ^5.8.3 |
| **Styling** | Tailwind CSS + PostCSS plugin | ^4.3.0 |
| **Database** | Supabase PostgreSQL (hosted atau self-hosted) | — |
| **Auth** | Supabase Auth, `@supabase/ssr`, `@supabase/supabase-js` | ^0.12.0 / ^2.108.1 |
| **Cache** | Redis client (best-effort, optional) | ^6.0.0 |
| **Data table** | `@tanstack/react-table` | ^8.21.3 |
| **Dialog** | `@radix-ui/react-dialog` | ^1.1.16 |
| **Testing** | Vitest | ^4.1.8 |
| **Linting** | ESLint + `eslint-config-next` | ^10.4.1 / ^16.2.9 |
| **Node** | Node.js | >= 22.0.0 |

Versi di atas mengikuti dependency ranges pada `package.json`. `package-lock.json` menyimpan resolusi install; perbarui tabel ini jika dependency utama berubah.

## 2. Struktur Direktori

Peta ringkas repo saat ini:

```
balance/
├── app/
│   ├── [locale]/             # Halaman dan layout localized
│   │   ├── (app)/            # Dashboard, wallets, settings, chat
│   │   ├── login/ register/  # Auth UI
│   │   ├── invite/           # Invitation acceptance
│   │   └── privacy/ terms/ refund-policy/ offline/
│   ├── actions/              # Server actions untuk UI mutations
│   ├── api/                  # AI, chat, reports, Midtrans, PWA, health
│   ├── auth/                 # OAuth callback dan email confirmation
│   └── globals.css
├── components/               # UI primitives, features, providers, PWA
├── lib/
│   ├── ai/                   # Chat, insight, guard, OCR, prompt, tools
│   ├── data/                 # Queries, mappers, loaders, cache
│   ├── midtrans/             # Payment integration
│   ├── pdf/                  # Report generation
│   ├── supabase/             # Server, browser, admin clients
│   └── i18n.ts, auth.ts, finance.ts, redis.ts, push-helper.ts, ...
├── messages/                 # id.json and en.json
├── supabase/migrations/      # Ordered SQL migrations
├── scripts/                  # VAPID keys and recurring scheduler
├── infra/                    # Caddyfile and Kong config
├── tests/unit/               # Vitest unit tests
└── docs/                     # Engineering, schema, API, testing, and product docs
```

Route entrypoint: `proxy.ts`. Exact dependencies and command scripts: `package.json`; deployment service details: the Docker Compose files.

## 3. Routing & Request Proxy

### 3.1. Request entrypoint (`proxy.ts`)

`proxy.ts` is the Next.js request proxy. It selects or redirects locale paths, refreshes the Supabase session for protected requests, redirects unauthenticated page requests to the localized login page, and redirects signed-in users away from login/register. The matcher skips framework assets, metadata files, and common static images. Public path behavior and matcher details live in `proxy.ts`; check that file before changing route boundaries.

Locale selection for bare or unlocalized paths uses an explicit locale path first, then the locale cookie, then the `Accept-Language` header, with Indonesian as the default.

### 3.2. Route map

The route group `(app)` is authenticated; the group name is not part of the URL.

```
/{locale}                                      → Public localized landing page
/{locale}/login, /{locale}/register            → Authentication UI
/{locale}/dashboard                            → Dashboard
/{locale}/wallets                              → Wallet list
/{locale}/wallets/[walletId]                   → Wallet overview
/{locale}/wallets/[walletId]/transactions      → Transactions
/{locale}/wallets/[walletId]/transactions/history → Transaction history
/{locale}/wallets/[walletId]/budgets           → Budgets
/{locale}/wallets/[walletId]/categories        → Categories
/{locale}/wallets/[walletId]/members            → Members
/{locale}/wallets/[walletId]/recurring          → Recurring transactions
/{locale}/wallets/[walletId]/savings             → Savings
/{locale}/wallets/[walletId]/settlements         → Settlements
/{locale}/wallets/[walletId]/templates           → Transaction templates
/{locale}/wallets/[walletId]/debts               → Debts
/{locale}/wallets/[walletId]/reports             → Reports
/{locale}/settings, /{locale}/chat, /{locale}/changelogs
/{locale}/invite/[token], /{locale}/auth/error
/{locale}/privacy, /{locale}/terms, /{locale}/refund-policy, /{locale}/offline
/auth/callback, /auth/confirm                  → OAuth callback and email confirmation

/api/chat/rekap, /api/chat/transaction         → External chat integration
/api/ai/chat, /api/ai/insight                   → AI chat and dashboard insight
/api/ai/confirm-transaction, /api/ai/ocr-scan   → AI transaction confirmation and receipt OCR
/api/reports/[walletId]/pdf                     → PDF report download
/api/midtrans/notification                      → Midtrans webhook
/api/vapid-key, /api/health                     → PWA key and health endpoints
```

Chat integration endpoints use per-user API keys. Other route handlers implement their own session, webhook, or input validation; inspect the handler when changing an endpoint.

### 3.3. Layout tree

```
app/layout.tsx
  └── app/[locale]/layout.tsx
      ├── localized public pages
      └── app/[locale]/(app)/layout.tsx
          ├── dashboard/
          ├── settings/
          ├── chat/
          └── wallets/[walletId]/*

app/auth/callback/route.ts
app/auth/confirm/route.ts
app/api/*/route.ts
```

## 4. Data Layer Architecture

### 4.1. Data Flow

```
Browser/Client
    ↓ Server Actions (mutations) atau Server Components (reads)
    ↓
app/actions/*.ts           # Server Actions — form handling, supabase mutations, revalidate
lib/data/queries.ts        # Supabase SELECT queries (read model)
lib/data/mappers.ts        # Transform DB rows → UI view models
lib/data/index.ts          # Composed loaders with React.cache + Redis cache
    ↓
Supabase (PostgreSQL + RLS)
    ↑ (optional)
Redis Cache (best-effort read cache)
```

### 4.2. Data Loaders (`lib/data/index.ts`)

The file composes request-scoped React cache with optional Redis-backed page data. Current loader groups include shell, dashboard, wallet bundle/overview, transactions/history, budgets, categories, recurring transactions, settings, savings, and debts. Check the exports in `lib/data/index.ts` when documenting a new loader. The wallet schema also includes `salary_cycle_day` (see `docs/DB_SCHEMA.md`), so verify period-boundary logic before changing budget or report date ranges.

### 4.3. Redis Cache Strategy

Redis is an optional best-effort cache; reads must continue to work if it is disabled or unavailable. Current TTL constants in `lib/data/cache.ts` are:

| Data | TTL |
|------|-----|
| Shell, dashboard, wallet overview, transactions/history, budgets, categories, recurring, savings | 300 seconds |
| Wallet bundle | 120 seconds |
| Settings | 600 seconds |

Keys are scoped by user and wallet; locale is appended where a cached view depends on it. Transaction history keys also include page, search, and sort options. Use the helpers in `lib/data/cache.ts` and invalidate wallet data through `invalidateWalletReadCaches(walletId, { targets, dashboardUserIds })`. Check the source constants if cache policy changes.

### 4.4. Server Actions (`app/actions/`)

Server actions handle UI-originated mutations. Shared form parsing, locale, redirect, and revalidation helpers are in `app/actions/_shared.ts`; action result types are in `app/actions/action-result.ts`.

Current action modules include transactions, wallets, budgets, savings, settlements, recurring transactions, templates, categories, auth/profile, theme, API keys, onboarding, debts, subscriptions, AI compliance, and reminders. Verify the current directory before adding or documenting an action.

For authenticated operations, use `requireUser()` and the authorization checks appropriate to that resource. Follow `docs/SERVER_ACTION_PATTERNS.md`; not every action has the same auth flow.

### 4.5. Chat API (`app/api/chat/`)

These endpoints support external chat integrations:

| Endpoint | Method | Request | Auth |
|----------|--------|---------|------|
| `/api/chat/rekap` | GET | Period and optional wallet ID | Bearer API key |
| `/api/chat/transaction` | POST | Transaction details and wallet ID | Bearer API key |

Rate limits are configurable through `CHAT_API_RATE_LIMIT_*` environment variables. Redis-backed limits fail open if Redis is unavailable. See `docs/API_REFERENCE.md`, `lib/chat-auth.ts`, and `lib/rate-limit.ts` for current behavior.

## 5. Component Architecture

### 5.1. UI Primitives (components/ui/)

| Komponen | Fungsi |
|----------|--------|
| `button.tsx` | Button dengan variant (primary, ghost, danger) |
| `dialog.tsx` | Modal dialog (Radix) |
| `sheet.tsx` | Drawer/sheet |
| `badge.tsx` | Badge/tag |
| `table.tsx` | Data table (TanStack Table) |
| `currency-input.tsx` | Input rupiah dengan format otomatis |
| `category-select.tsx` | Dropdown kategori |
| `confirm-dialog.tsx` | Konfirmasi aksi berbahaya |
| `empty-state.tsx` | Empty state illustration |
| `stat-card.tsx` | Kartu metrik (saldo, pengeluaran) |
| `submit-button.tsx` | Button dengan loading state untuk form |
| `confirm-submit-button.tsx` | Submit + konfirmasi |
| `toast-provider.tsx` | Toast notification |
| `toast-feedback.tsx` | Komponen toast |
| `inline-edit-panel.tsx` | Panel edit inline |
| `page-loading-skeleton.tsx` | Skeleton loading |
| `app-icon.tsx` | App icon component |
| `route-transition.tsx` | Route transition wrapper |
| `notice.tsx` | Info/warning notice |
| `action-form.tsx` | Form wrapper untuk server action |

### 5.2. Feature Components

| Feature | Komponen | Keterangan |
|---------|----------|------------|
| **Auth** | `auth-brand-panel.tsx` | Brand panel di halaman login/register |
| **Auth** | `google-sign-in-button.tsx` | Google OAuth button |
| **App** | `app-shell.tsx` | Main layout (sidebar, header) |
| **App** | `wallet-tabs.tsx` | Wallet navigation tabs |
| **App** | `invitation-share-actions.tsx` | Bagikan undangan |
| **Dashboard** | `dashboard-content.tsx` | Halaman dashboard |
| **Dashboard** | `dashboard-daily-expense-chart.tsx` | Area chart pengeluaran harian |
| **Dashboard** | `dashboard-onboarding-card.tsx` | Kartu onboarding |
| **Wallets** | `wallets-page-content.tsx` | Daftar dompet |
| **Wallets** | `wallet-overview-content.tsx` | Overview dompet |
| **Transactions** | `transactions-page-content.tsx` | CRUD transaksi |
| **Transactions** | `transaction-history-page-content.tsx` | Riwayat + filter |
| **Budgets** | `budgets-page-content.tsx` | Budget management |
| **Savings** | `savings-page-content.tsx` | Tabungan management |
| **Recurring** | `recurring-page-content.tsx` | Transaksi berulang |
| **Settings** | `settings-page-content.tsx` | Settings page |
| **PWA** | `install-prompt.tsx` | Ajak install PWA |
| **PWA** | `service-worker-registration.tsx` | Daftarkan SW |
| **AI Chat** | `chat-page-content.tsx`, `dashboard-ai-insight.tsx` | Chat dan insight dashboard |
| **OCR** | `scan-receipt-button.tsx` | Pemindaian struk |
| **Reports** | `export-pdf-button.tsx` | Export PDF |
| **Transactions** | `import-excel-dialog.tsx`, `export-excel-button.tsx` | Import/export Excel |
| **Locale** | `locale-provider.tsx` | React context locale |

---

## 6. Auth Flow

### 6.1. Email Auth
```
Login form → supabase.auth.signInWithPassword()
    → Supabase Auth → set session cookies (via @supabase/ssr)
    → proxy.ts membaca cookie → getUser() → user terdeteksi
```

### 6.2. Google OAuth
```
Google button → supabase.auth.signInWithOAuth({ provider: 'google' })
    → Redirect ke Google consent → callback ke /auth/callback
    → Callback route → exchange code for session → set cookies
    → Redirect ke dashboard
```

### 6.3. Auth Sync
Setiap registrasi/login dari auth.users:
```
Trigger on_auth_user_synced
    → handle_auth_user_sync()
    → INSERT OR UPDATE profiles
    → Fallback full_name dari 'full_name' → 'name' (Google OAuth)
```

---

## 7. Theme System

- **Dua mode render:** Light Mode & Dark Mode (keduanya first-class)
- **Preferensi user:** `light`, `dark`, atau `system` (system hanya pilih antara dua mode)
- **CSS variables** di `app/globals.css` untuk semua token tema
- **Server action** `theme.ts` update `profiles.theme_preference`
- **Utility:** `lib/theme.ts` untuk resolve theme dari preferensi + sistem

**Token utama (light mode reference):**
```
--color-surface: #fbf9f3 (cream)
--color-primary: #595f3d (sage)
--color-tertiary: #555f4e (forest)
--font-headline: 'Hanken Grotesk', sans-serif
--font-body: 'Inter', sans-serif
--font-label: 'Geist', sans-serif
```

---

## 8. i18n System

- Supported locales: Indonesian (`id`, default) and English (`en`).
- Dictionaries: `messages/id.json` and `messages/en.json`; lookup helpers: `lib/i18n.ts`.
- Use `translate(locale, key, values)` or `getTranslator(locale)`. Keys support nested paths and `{placeholder}` interpolation.
- Missing English entries fall back to Indonesian; add or update both dictionaries for user-facing copy rather than relying on fallback.
- `proxy.ts` handles localized path redirects and persists the locale cookie. The profile also stores a preferred locale; inspect the settings/action flow when changing preference behavior.

## 9. Deployment

### 9.1. Docker Production (docker-compose.yml)

```
Services:
  - app:       Next.js standalone (port 3000) via Caddy reverse proxy
  - redis:     Redis untuk caching + rate limiting
  - scheduler: Job recurring transaksi (loop)
  - caddy:     Reverse proxy (auto HTTPS)
```

**Dockerfile:**
- Base: `node:22-alpine`
- Builder stage: `npm ci` + `next build`
- Runner stage: Hanya standalone output + `node_modules` produksi
- Platform: `linux/arm64` (default)

### 9.2. Self-Hosted Supabase (docker-compose.self-hosted.yml)

Stack lengkap untuk development lokal:
- Supabase Studio (dashboard admin DB)
- PostgreSQL
- GoTrue (auth)
- Realtime
- Storage
- Mailpit (email testing SMTP)

### 9.3. Infrastructure Files

| File | Fungsi |
|------|--------|
| `infra/Caddyfile` | Caddy reverse proxy config |
| `infra/kong.yml` | Kong API gateway config (untuk production API) |

---

## 10. Testing Strategy

Vitest runs the unit suite with `npm run test` (same script as `npm test`). The `server-only` package is aliased to `tests/support/server-only.ts`.

Tests cover finance/date helpers, data mapping, auth and action behavior, cache/rate limits, i18n/theme, AI chat and OCR helpers, and report generation. Follow the existing deterministic patterns in `tests/unit/`; avoid requiring live Supabase, Redis, or external AI services for unit tests.

For code changes, run:

```bash
npm run lint
npm run typecheck
npm run test
```

Run `npm run build` when changes affect routing, rendering, dependencies, environment handling, or deployment.

## 11. CI/CD

GitHub Actions uses `.github/workflows/ci.yml` for pushes to `main` and pull requests targeting `main`. It installs with `npm ci`, then runs lint → typecheck → test → build. Build receives placeholder public Supabase and site environment values in CI.

The Docker publish workflow is `.github/workflows/docker-publish.yml`; read it for the current release triggers.

## 12. Environment Variables (`.env.example`)

Treat `.env.example` and `lib/env.ts` as the authoritative environment variable list and validation rules. Common variables include:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key |
| `SUPABASE_SECRET_KEY` | Server-only privileged Supabase key |
| `NEXT_PUBLIC_SITE_URL` | Public app URL |
| `REDIS_URL`, `REDIS_ENABLED` | Optional cache and rate-limit storage |
| `DEEPSEEK_API_KEY`, `AI_CHAT_ENABLED` | AI chat provider and feature toggle |
| `MIDTRANS_SERVER_KEY`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Subscription payments |
| `VISION_API_KEY`, `VISION_ENABLED` | Optional receipt OCR provider |
| `RECURRING_SCHEDULER_INTERVAL_MS`, `RECURRING_SCHEDULER_BATCH_SIZE` | Recurring scheduler |

Do not expose server-only keys through client components or public environment variables.

## 13. Key Design Decisions

| Keputusan | Alasan |
|-----------|--------|
| **Server actions dan route handlers** | UI mutations umumnya memakai server actions; webhooks, streaming, downloads, health, dan external integrations memakai route handlers |
| **React.cache + Redis** | React cache untuk request-scoped caching, Redis untuk cache antar-request (best-effort) |
| **RLS-based security** | RLS melindungi akses data di tingkat database, dengan authorization/membership checks di server untuk operasi wallet. Migration 0001 memberi grant luas ke role authenticated, jadi setiap tabel yang dapat diakses role ini harus memiliki RLS dan policy yang benar |
| **Supabase migrations** | Schema versioning, rollback support, dokumentasi otomatis |
| **No ORM (raw Supabase JS)** | Supabase JS sudah mature, transparan, tidak perlu layer abstraksi tambahan |
| **Tailwind CSS 4 + PostCSS** | Styling memakai Tailwind CSS 4 melalui plugin `@tailwindcss/postcss`; lihat `postcss.config.js` |
| **Manual i18n (tanpa next-intl)** | Helper lokal `lib/i18n.ts` memakai dictionaries untuk locale `id` dan `en`; pertahankan kedua terjemahan pada perubahan copy |
| **Area chart (bukan bar chart)** | Lebih tenang visualnya, cocok dengan Serene Capital design |
| **Caddy (bukan Nginx)** | Auto HTTPS via Let's Encrypt, konfigurasi lebih sederhana |
