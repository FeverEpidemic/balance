<p align="center">
  <img src="public/logo-balance-wordmark.svg" alt="Balance" width="200"/>
</p>

<p align="center">
  <strong>Personal & household finance tracker — in Bahasa Indonesia</strong>
</p>

<p align="center">
  <a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/License-AGPL%20v3-blue.svg" alt="License: AGPL v3"/></a>
  <a href="https://github.com/FeverEpidemic/balance/stargazers"><img src="https://img.shields.io/github/stars/FeverEpidemic/balance" alt="GitHub stars"/></a>
  <a href="https://mybalance.my.id"><img src="https://img.shields.io/badge/demo-mybalance.my.id-brightgreen" alt="Demo"/></a>
  <a href="https://github.com/FeverEpidemic/balance/actions"><img src="https://img.shields.io/github/actions/workflow/status/FeverEpidemic/balance/ci.yml" alt="CI"/></a>
</p>

# balance

> **Self-hosted?** Jump to the [Docker setup](#run-locally).  
> **Want the hosted version?** Go to [mybalance.my.id](https://mybalance.my.id) — no setup required.

`balance` is a mobile-responsive Next.js MVP for household finance in Bahasa Indonesia. It follows the product scope in [docs/plans/PLAN.md](docs/plans/PLAN.md) and the visual direction in [DESIGN.md](DESIGN.md).

## 🏠 Self-Hosted Mode

Balance auto-detects whether it's running as self-hosted or SaaS:

1. **Explicit `SELF_HOSTED_MODE` env var** — set `SELF_HOSTED_MODE=true` or `false` to override.
2. **Auto-detect fallback** — if `MIDTRANS_SERVER_KEY` is not configured (or is a placeholder), it forces self-hosted mode.

| Mode | `SELF_HOSTED_MODE` | Result |
|------|--------------------|--------|
| Self-hosted | `true` (or auto-detected) | ✅ All features unlocked, no billing checks |
| SaaS | `false` + Midtrans keys configured | 🔒 Free tier limited, Premium via subscription |

To explicitly enable self-hosted:
```env
SELF_HOSTED_MODE=true
```

To run as SaaS (requires Midtrans):
```env
SELF_HOSTED_MODE=false
MIDTRANS_SERVER_KEY=your_real_key
```

The Docker Compose default is `SELF_HOSTED_MODE=true` — override it via `.env` if needed.

## Included

- Responsive App Router pages for login, register, invite, dashboard, wallets, transactions, budgets, reports, members, settlements, and templates
- Recurring transaction management with daily, weekly, and monthly schedules plus background scheduler processing
- Design tokens and UI system derived from the provided serene finance theme
- Supabase-hosted SSR auth integration for Next.js App Router
- Supabase-ready schema with RLS for wallets, members, invitations, budgets, transactions, splits, settlements, and templates
- Docker Compose scaffold for app, reverse proxy, self-hosted Supabase core services, and daily Postgres backups

## Run locally

1. Copy `.env.example` to `.env`.
2. Use Node.js `20.9.0` or newer. If you use `nvm`, run `nvm use` from the repo root to pick up `.nvmrc`.
3. Install dependencies with `npm install`.
4. Start the frontend with `npm run dev`.

## Node.js Version

- Local development should use Node.js `20.9.0` or newer, matching the `engines.node` field in `package.json`.
- The repo now includes `.nvmrc` pinned to `20.9.0` so `nvm use` selects a compatible version quickly.
- Docker production images already run on Node 22 Alpine, so this mainly aligns local workflows, install behavior, and Supabase package warnings.

## Test Wallet Invitation Locally

Untuk self-hosted local stack, file `.env.example` sudah menyiapkan email Auth Supabase ke `Mailpit`.

1. Copy `.env.example` ke `.env`.
2. Jalankan stack self-hosted dengan `docker compose -f docker-compose.self-hosted.yml up --build`.
3. Buka inbox lokal di `http://localhost:8025`.
4. Daftar akun baru dan cek email verifikasi masuk di Mailpit bila Auth email aktif.
5. Buat invitation dari halaman anggota wallet, lalu salin atau bagikan tautan `/invite/[token]` yang dihasilkan.

Kalau ingin memakai SMTP sungguhan untuk email Auth Supabase, ganti `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, dan `SMTP_FROM` di `.env`.

Jika ingin mencoba login Google pada stack self-hosted lokal, isi juga:

```env
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
GOTRUE_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

Redis cache v1 untuk read path dashboard dan wallet utama juga aktif di stack self-hosted ini. Default lokalnya memakai `REDIS_URL=redis://redis:6379`. Jika ingin mematikan cache sementara, set `REDIS_ENABLED=false`.
Untuk observability ringan, aktifkan `REDIS_METRICS_ENABLED=true`. Aplikasi akan mencetak summary hit, miss, write, error, dan invalidation ke stdout setiap `REDIS_METRICS_INTERVAL_MS` milidetik.

Endpoint `/api/chat/*` juga memakai Redis untuk rate limiting per API key. Default-nya `60` request per `60` detik lewat `CHAT_API_RATE_LIMIT_MAX_REQUESTS` dan `CHAT_API_RATE_LIMIT_WINDOW_SECONDS`, serta bisa dimatikan dengan `CHAT_API_RATE_LIMIT_ENABLED=false`.
Limiter ini tetap best-effort: kalau Redis tidak tersedia atau gagal diakses, request valid tetap dilayani tanpa diblokir.

## Use Hosted Supabase

If you want to use Supabase Cloud instead of the self-hosted Docker stack in this repo, use this setup:

1. Create a hosted project in the Supabase dashboard.
2. Get the `Project URL` and publishable key from the project's `Connect` dialog or API settings.
3. Put these values in your local `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SCHEDULER_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
```

4. Keep `SUPABASE_SECRET_KEY` server-side only. Never expose it in browser code.
5. Apply all schema migrations:
   - [supabase/migrations/0001_balance_mvp.sql](supabase/migrations/0001_balance_mvp.sql)
   - [supabase/migrations/0002_balance_auth_sync.sql](supabase/migrations/0002_balance_auth_sync.sql)
   - [supabase/migrations/0003_fix_wallet_rls_recursion.sql](supabase/migrations/0003_fix_wallet_rls_recursion.sql)
   - [supabase/migrations/0004_wallet_invites_token_only.sql](supabase/migrations/0004_wallet_invites_token_only.sql)
   - [supabase/migrations/0005_wallet_member_capacity.sql](supabase/migrations/0005_wallet_member_capacity.sql)
   - [supabase/migrations/0006_recurring_transactions.sql](supabase/migrations/0006_recurring_transactions.sql)
   - [supabase/migrations/0007_savings.sql](supabase/migrations/0007_savings.sql)
   - [supabase/migrations/0008_saving_entry_transactions.sql](supabase/migrations/0008_saving_entry_transactions.sql)
   - [supabase/migrations/0009_google_oauth_profile_name_fallback.sql](supabase/migrations/0009_google_oauth_profile_name_fallback.sql)
   - [supabase/migrations/0010_transaction_balance_adjustments.sql](supabase/migrations/0010_transaction_balance_adjustments.sql)
   - [supabase/migrations/0011_security_fixes.sql](supabase/migrations/0011_security_fixes.sql)
   - [supabase/migrations/0011_user_api_keys.sql](supabase/migrations/0011_user_api_keys.sql)
   - [supabase/migrations/0012_user_onboarding.sql](supabase/migrations/0012_user_onboarding.sql)
   - [supabase/migrations/0013_profile_theme_preference.sql](supabase/migrations/0013_profile_theme_preference.sql)
   - [supabase/migrations/0014_profile_preferred_locale.sql](supabase/migrations/0014_profile_preferred_locale.sql)
   - [supabase/migrations/0015_user_plan_tier.sql](supabase/migrations/0015_user_plan_tier.sql)
   - [supabase/migrations/0016_profiles_timezone.sql](supabase/migrations/0016_profiles_timezone.sql)
   - [supabase/migrations/0017_wallets_currency.sql](supabase/migrations/0017_wallets_currency.sql)
   - [supabase/migrations/0018_wallet_balance_rpc.sql](supabase/migrations/0018_wallet_balance_rpc.sql)
   - [supabase/migrations/0019_free_trial.sql](supabase/migrations/0019_free_trial.sql)
   - [supabase/migrations/0020_profiles_ai_chat_compliance.sql](supabase/migrations/0020_profiles_ai_chat_compliance.sql)

Recommended migration workflow for hosted Supabase:

1. Install the Supabase CLI.
2. Log in with `supabase login`.
3. Link this repo to your hosted project with `supabase link`.
4. Push the SQL migrations with `supabase db push`.
5. In Supabase Auth email templates, update the confirm-signup URL to:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

6. If you want Google login, enable the Google provider in Supabase Auth and configure:
   - Google OAuth redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Authorized JavaScript origin: your frontend origin, for example `http://localhost:3000` or `https://balance.yourdomain.com`
   - App callback route handled by this repo: `https://YOUR_APP_DOMAIN/auth/callback`

After that, run the frontend normally with `npm run dev`.

Compatibility note:
- The app now prefers `SUPABASE_SECRET_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` is still accepted as a fallback for older setups.

## Hosted vs Self-Hosted

- Use hosted Supabase if you want the fastest path to a working backend with managed Auth, Postgres, dashboard, and backups.
- Use the included `docker-compose.yml` if you specifically want full infrastructure ownership on your own VPS.
- For this repo, the frontend can work with either model as long as the env vars point to the correct project.

## Google Login Setup

Flow Google login di aplikasi ini memakai Supabase OAuth lalu mengembalikan user ke callback aplikasi `SITE_URL/auth/callback`. Parameter `next` tetap dipertahankan untuk deep-link internal seperti `/invite/[token]`.

### Hosted Supabase

1. Aktifkan provider Google di dashboard Supabase pada menu `Authentication > Providers`.
2. Isi Google Client ID dan Client Secret dari Google Cloud Console.
3. Tambahkan redirect URI Supabase berikut ke OAuth client Google:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

4. Tambahkan origin frontend Anda ke daftar authorized JavaScript origins, misalnya:

```text
http://localhost:3000
https://balance.yourdomain.com
```

5. Pastikan `NEXT_PUBLIC_SITE_URL` atau `APP_SITE_URL` mengarah ke domain aplikasi frontend, karena aplikasi ini akan menerima user kembali di:

```text
https://YOUR_APP_DOMAIN/auth/callback
```

### Self-Hosted Supabase

Untuk stack `docker-compose.self-hosted.yml`, isi env berikut di `.env`:

```env
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
GOTRUE_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

Tambahkan redirect URI Supabase self-hosted ke Google Cloud sesuai base URL Auth Anda, misalnya:

```text
http://localhost:8000/auth/v1/callback
https://supabase.yourdomain.com/auth/v1/callback
```

Pastikan juga:
- `APP_SITE_URL` mengarah ke domain aplikasi Next.js, misalnya `http://localhost:3000` atau `https://balance.yourdomain.com`
- `GOTRUE_URI_ALLOW_LIST` mengizinkan `APP_SITE_URL` dan `APP_SITE_URL/auth/callback`
- `NEXT_PUBLIC_SITE_URL` atau `APP_SITE_URL` di frontend memakai origin yang sama dengan route callback `/auth/callback`

## Docker Build for ARM64 VPS

The app now includes a production `Dockerfile` with multi-stage build and Next.js `standalone` output, so it can be built natively on an `arm64` VPS.

1. Copy `.env.example` to `.env` and fill the required values.
2. Build and start on an ARM64 VPS:

```bash
DOCKER_PLATFORM=linux/arm64 docker compose up --build -d
```

Pastikan `.env` sudah berisi nilai publik yang dipakai saat build image:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://YOUR_APP_DOMAIN
```

3. If you want to build the app image only:

```bash
docker build \
  --platform linux/arm64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY \
  --build-arg NEXT_PUBLIC_SITE_URL=https://YOUR_APP_DOMAIN \
  -t balance-app:latest .
```

If the VPS itself is already ARM64, Docker will build the correct architecture natively. The `DOCKER_PLATFORM` variable is kept in Compose so the target platform stays explicit.

## Notes

- The core UI now reads and writes live data for auth, wallets, transactions, budgets, templates, and settlements.
- Recurring transaction generation runs via the `scheduler` service in Docker Compose and calls the database RPC with the server key.
- Wallet member invitations are token-based. Owner membuat tautan `/invite/[token]` dari halaman anggota, lalu membagikannya ke calon anggota.
- SMTP di stack ini tetap dipakai untuk email Auth Supabase seperti verifikasi signup, bukan lagi untuk invitation wallet.

- run buat build docker images

docker buildx build \
  --platform linux/arm64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY \
  --build-arg NEXT_PUBLIC_SITE_URL=https://YOUR_APP_DOMAIN \
  -t ilham827/balance-app:latest \
  -t ilham827/balance-app:arm64 \
  --push .
