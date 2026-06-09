---
title: Balance — Engineering Architecture
version: 1.0.0
last_updated: 2026-06-09
stack: Next.js 15.3 · React 19 · TypeScript 5.8 · Tailwind 3.4 · Supabase · Redis
---

# Balance — Engineering Architecture

> Arsitektur teknis lengkap: stack, routing, data layer, server actions, komponen, deployment.
> Dokumen ini dibuat untuk dibaca oleh AI agent maupun manusia.

---

## 1. Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Framework** | Next.js (App Router) | ^15.3.2 |
| **UI Library** | React | ^19.1.0 |
| **Bahasa** | TypeScript (strict) | ^5.8.3 |
| **Styling** | Tailwind CSS | ^3.4.17 |
| **Database** | Supabase PostgreSQL (hosted atau self-hosted) | — |
| **Auth** | Supabase Auth (email + Google OAuth) | — |
| **Cache** | Redis (best-effort, optional) | ^4.7.1 |
| **ORM / Client DB** | @supabase/supabase-js | ^2.56.0 |
| **SSR Auth** | @supabase/ssr | ^0.10.3 |
| **Tabel/data** | @tanstack/react-table | ^8.21.3 |
| **Dialog** | @radix-ui/react-dialog | ^1.1.16 |
| **Testing** | Vitest | ^0.34.6 |
| **Linting** | ESLint 8 + eslint-config-next | — |
| **Node** | >= 20.9.0 (di Docker: 22 Alpine) | |

---

## 2. Struktur Direktori

```
balance/
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n route segment
│   │   ├── (app)/          # Authenticated layout group
│   │   │   ├── dashboard/  # Dashboard page
│   │   │   ├── settings/   # Settings page
│   │   │   └── wallets/    # Wallet list + detail
│   │   ├── auth/           # Auth callback pages
│   │   ├── invite/         # Invitation acceptance
│   │   ├── login/          # Login page
│   │   ├── register/       # Register page
│   │   ├── offline/        # PWA offline page
│   │   └── privacy/        # Privacy page
│   ├── actions/            # Server Actions (mutations)
│   ├── api/chat/           # Chat API (rekap + transaksi)
│   └── globals.css         # Global styles + theme tokens
│
├── components/             # React components
│   ├── ui/                 # UI primitives
│   ├── auth/               # Auth-related components
│   ├── features/           # Feature-specific components
│   │   ├── dashboard/
│   │   ├── wallets/
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── savings/
│   │   ├── recurring/
│   │   └── settings/
│   ├── providers/          # React context providers
│   └── pwa/                # PWA components
│
├── lib/                    # Core business logic
│   ├── data/               # Data layer (queries, mappers, cache)
│   ├── supabase/           # Supabase client factories
│   ├── auth.ts             # Auth helpers
│   ├── finance.ts          # Finance utilities
│   ├── redis.ts            # Redis client wrapper
│   ├── recurring.ts        # Recurring transaction logic
│   └── ...
│
├── messages/               # i18n translation files
│   ├── en.json
│   └── id.json
│
├── supabase/migrations/    # Database migrations (0014 files)
│
├── scripts/                # CLI scripts
│   ├── run-recurring-scheduler.mjs
│   └── backup.sh
│
├── tests/unit/             # Unit tests (Vitest)
│
├── infra/                  # Infrastructure configs
│   ├── Caddyfile           # Caddy reverse proxy
│   └── kong.yml            # Kong API gateway config
│
├── docs/                   # Documentation
│   ├── PRD.md              # ← Product Requirements Document
│   ├── DB_SCHEMA.md        # ← Database Schema & Flow
│   └── ENGINEERING.md      # ← This document
│
├── docker-compose.yml      # Production Docker stack
├── docker-compose.self-hosted.yml  # Self-hosted Supabase stack
└── Dockerfile              # Next standalone build + Node 22 Alpine
```

---

## 3. Routing & Middleware

### 3.1. Middleware (`middleware.ts`)

Middleware menangani 3 hal:

1. **Locale detection & redirect** — Deteksi locale dari cookie, pathname, atau Accept-Language header. `GET /` → redirect ke `/{locale}/`
2. **Auth guard** — Cek session via `supabase.auth.getUser()`. Jika tidak login dan path bukan public → redirect ke `/login?next=...`
3. **Public paths** — `/login`, `/register`, `/auth/*`, `/invite/*`, `/api/chat/*`, `/privacy`, `/offline` — tanpa auth check

**Regex matcher:** `/((?!_next/static|_next/image|favicon.ico|manifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`

### 3.2. Route Structure

```
/{locale}/                 → Landing page (redirect ke dashboard)
/{locale}/login            → Login page (email + Google OAuth)
/{locale}/register         → Register page
/{locale}/dashboard        → Main dashboard (authenticated)
/{locale}/wallets          → Daftar dompet
/{locale}/wallets/[walletId] → Detail dompet (overview, transaksi, budget, member, tabungan)
/{locale}/settings         → Pengaturan (tema, bahasa, API keys)
/{locale}/invite/[token]   → Accept invitation
/{locale}/auth/callback    → OAuth callback
/{locale}/auth/confirm     → Email confirmation
/{locale}/privacy          → Privacy policy
/{locale}/offline          → PWA offline page

/api/chat/rekap            → Rekap API (GET)
/api/chat/transaction      → Input transaksi API (POST)
```

### 3.3. Layout Tree

```
app/layout.tsx (root — html, body, font loading)
  └── app/[locale]/layout.tsx (locale provider, locale params)
      ├── app/[locale]/login/page.tsx (public)
      ├── app/[locale]/register/page.tsx (public)
      ├── app/[locale]/(app)/layout.tsx (auth guard + app-shell + sidebar)
      │   ├── dashboard/page.tsx
      │   ├── wallets/page.tsx
      │   ├── wallets/[walletId]/page.tsx
      │   └── settings/page.tsx
      ├── app/[locale]/invite/[token]/page.tsx
      └── app/[locale]/auth/* (callback routes)
```

---

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

### 4.2. Data Loaders (lib/data/index.ts)

| Loader | Fungsi | Caching |
|--------|--------|---------|
| `getShellData(userId)` | Data shell global (nama user, jumlah wallet, budget, member, onboarding state) | React cache |
| `getDashboardData(userId, locale)` | Data dashboard lengkap (saldo, chart transaksi, budget progress, transaksi terbaru) | React cache + Redis (TTL 60s) |
| `getWalletBundle(userId, walletId)` | Semua data untuk halaman detail dompet | React cache |
| `getWalletOverviewData(userId, walletId, locale)` | Overview dompet spesifik | React cache + Redis (TTL 60s) |
| `getTransactionsPageData(...)` | Data transaksi + pagination | React cache + Redis |
| `getTransactionHistoryPageData(...)` | Riwayat transaksi | React cache + Redis |
| `getBudgetsPageData(...)` | Data budget | React cache + Redis |
| `getSavingsPageData(...)` | Data tabungan | React cache + Redis |
| `getRecurringTransactionsPageData(...)` | Transaksi berulang | React cache + Redis |
| `getSettingsData(userId, locale)` | Data settings (API keys) | React cache + Redis |

### 4.3. Redis Cache Strategy

- **Best-effort** — semua fitur harus tetap jalan saat Redis tidak tersedia (`REDIS_ENABLED=false`)
- **TTL per key:** Dashboard 60s, wallet overview 60s, transactions 60s, budgets 60s, savings 60s, recurring 60s, settings 120s
- **Invalidasi:** `invalidateWalletReadCaches(walletId, userId)` dipanggil setelah mutasi
- **Key format:** `{userId}:{locale}:{page}`

### 4.4. Server Actions (lib/actions/)

| File | Fungsi Utama |
|------|-------------|
| `transactions.ts` | Create, update, delete transaksi |
| `wallets.ts` | Create, update, archive wallet; manage member roles |
| `budgets.ts` | CRUD budget |
| `savings.ts` | Create saving, deposit/withdraw |
| `settlements.ts` | Create settlement |
| `recurring-transactions.ts` | CRUD recurring + pause/resume |
| `templates.ts` | CRUD template transaksi |
| `auth.ts` | Update profil |
| `theme.ts` | Update tema |
| `api-keys.ts` | Generate API key |
| `onboarding.ts` | Dismiss/selesaikan onboarding |
| `_shared.ts` | Helpers: redirectWithMessage, revalidateWalletPaths, getActionLocale |
| `action-result.ts` | Action result types (success/error) |

**Pola server action:**
```typescript
"use server";
export async function createTransaction(formData: FormData) {
  const { supabase, user } = await requireUser();
  // ... validasi form via _shared.ts helpers
  // ... insert ke supabase
  // ... invalidate Redis cache
  // ... revalidate path
  // ... redirectWithMessage (success/error)
}
```

### 4.5. Chat API (app/api/chat/)

Dua endpoint publik untuk integrasi AI / chatbot:

| Endpoint | Method | Query/Body | Auth |
|----------|--------|------------|------|
| `/api/chat/rekap` | GET | `?period=day|week|month`, optional `?wallet_id=` | Bearer token (API key) |
| `/api/chat/transaction` | POST | `{wallet_id, amount, kind, category_id?, note?, happened_at?}` | Bearer token (API key) |

**Autentikasi API:**
```typescript
// lib/chat-auth.ts
// 1. Parse Bearer token dari header
// 2. SHA256 hash token
// 3. Query user_api_keys via service_role client
// 4. Validasi: hash cocok, tidak revoked
// 5. Set session user untuk RLS
```

**Rate limiting** (`lib/rate-limit.ts`): Redis-based sliding window, default 30 request per menit per key.

---

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
| **Locale** | `locale-provider.tsx` | React context locale |

---

## 6. Auth Flow

### 6.1. Email Auth
```
Login form → supabase.auth.signInWithPassword()
    → Supabase Auth → set session cookies (via @supabase/ssr)
    → Middleware membaca cookie → getUser() → user terdeteksi
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

- **Bahasa:** Indonesia (default) dan Inggris
- **File:** `/messages/id.json`, `/messages/en.json`
- **Fungsi:** `translate(locale, key)` — lookup sederhana (tanpa next-intl library, tanpa ICU)
- **Deteksi locale:** cookie > pathname > Accept-Language header
- **Penyimpanan:** `preferred_locale` di tabel profiles

---

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

**Framework:** Vitest
**Server-only mock:** `tests/support/server-only.ts` (alias untuk `server-only` package)

| Test File | Coverage |
|-----------|----------|
| `finance.test.ts` | Format mata uang, parse angka, date helpers |
| `data-mappers.test.ts` | Transformasi DB → view model |
| `recurring.test.ts` | Logika recurring occurrence |
| `redis-cache.test.ts` | Cache get/set/invalidate |
| `auth-flow.test.ts` | Auth sync logic |
| `chat-api-rate-limit.test.ts` | Rate limiting |
| `chat-auth.test.ts` | API key authentication |
| `wallet-capacity.test.ts` | Batas member per wallet |
| `balance-adjustments.test.ts` | Balance adjustment helpers |
| `theme.test.ts` | Theme resolution |
| `theme-actions.test.ts` | Theme update actions |
| `rate-limit.test.ts` | Rate limiter logic |
| `onboarding-actions.test.ts` | Onboarding state mutations |
| `action-results.test.ts` | Server action result types |
| `utils.test.ts` | Generic utilities |
| `i18n.test.ts` | Translation lookup |

**Cara menjalankan:**
```bash
npm run test          # vitest run
npm run test:unit     # vitest run (sama)
npm run typecheck     # tsc --noEmit
```

---

## 11. CI/CD

### GitHub Actions Workflows:

| Workflow | File | Trigger |
|----------|------|---------|
| CI | `.github/workflows/ci.yml` | Push ke main/dev, PR ke main |
| Docker Publish | `.github/workflows/docker-publish.yml` | Push tag/release |

**CI steps:** `npm ci` → `npm run typecheck` → `npm run lint` → `npm run test` → `npm run build`

---

## 12. Environment Variables (.env.example)

| Variable | Required | Keterangan |
|----------|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SECRET_KEY` | ✅ | Service role key (server-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key alias |
| `REDIS_URL` | ❌ | Redis connection string |
| `REDIS_ENABLED` | ❌ | Default: false |
| `DOMAIN` | ✅ | Domain untuk deploy |
| `NEXT_PUBLIC_APP_URL` | ✅ | App URL |
| `SCHEDULER_POLL_INTERVAL_SECONDS` | ❌ | Recurring scheduler interval |
| `SCHEDULER_RUN_BATCH_SIZE` | ❌ | Recurring batch size |

---

## 13. Key Design Decisions

| Keputusan | Alasan |
|-----------|--------|
| **Server Actions (bukan API routes)** | Mutasi langsung dari form, bundled code di server, tidak perlu endpoint REST untuk CRUD |
| **React.cache + Redis** | React cache untuk request-scoped caching, Redis untuk cache antar-request (best-effort) |
| **RLS-based security** | Setiap query terjamin aman oleh database, server action tidak perlu manual check per row |
| **Supabase migrations** | Schema versioning, rollback support, dokumentasi otomatis |
| **No ORM (raw Supabase JS)** | Supabase JS sudah mature, transparan, tidak perlu layer abstraksi tambahan |
| **PostCSS (bukan Turbopack)** | kompatibilitas Tailwind 3 |
| **Manual i18n (tanpa next-intl)** | Lebih ringan dari next-intl, cukup untuk 2 bahasa, tanpa SSR hydration mismatch |
| **Area chart (bukan bar chart)** | Lebih tenang visualnya, cocok dengan Serene Capital design |
| **Caddy (bukan Nginx)** | Auto HTTPS via Let's Encrypt, konfigurasi lebih sederhana |
