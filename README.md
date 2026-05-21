# balance

`balance` is a mobile-responsive Next.js MVP for household finance in Bahasa Indonesia. It follows the product scope in [PLAN.md](/d:/Project/balance/PLAN.md) and the visual direction in [DESIGN.md](/d:/Project/balance/DESIGN.md).

## Included

- Responsive App Router pages for login, register, invite, dashboard, wallets, transactions, budgets, reports, members, settlements, and templates
- Design tokens and UI system derived from the provided serene finance theme
- Supabase-hosted SSR auth integration for Next.js App Router
- Supabase-ready schema with RLS for wallets, members, invitations, budgets, transactions, splits, settlements, and templates
- Docker Compose scaffold for app, reverse proxy, self-hosted Supabase core services, and daily Postgres backups

## Run locally

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start the frontend with `npm run dev`.

## Use Hosted Supabase

If you want to use Supabase Cloud instead of the self-hosted Docker stack in this repo, use this setup:

1. Create a hosted project in the Supabase dashboard.
2. Get the `Project URL` and publishable key from the project's `Connect` dialog or API settings.
3. Put these values in your local `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Never expose it in browser code.
5. Apply both schema migrations:
   - [supabase/migrations/0001_balance_mvp.sql](/d:/Project/balance/supabase/migrations/0001_balance_mvp.sql)
   - [supabase/migrations/0002_balance_auth_sync.sql](/d:/Project/balance/supabase/migrations/0002_balance_auth_sync.sql)

Recommended migration workflow for hosted Supabase:

1. Install the Supabase CLI.
2. Log in with `supabase login`.
3. Link this repo to your hosted project with `supabase link`.
4. Push the SQL migrations with `supabase db push`.
5. In Supabase Auth email templates, update the confirm-signup URL to:

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

After that, run the frontend normally with `npm run dev`.

## Hosted vs Self-Hosted

- Use hosted Supabase if you want the fastest path to a working backend with managed Auth, Postgres, dashboard, and backups.
- Use the included `docker-compose.yml` if you specifically want full infrastructure ownership on your own VPS.
- For this repo, the frontend can work with either model as long as the env vars point to the correct project.

## Docker Build for ARM64 VPS

The app now includes a production `Dockerfile` with multi-stage build and Next.js `standalone` output, so it can be built natively on an `arm64` VPS.

1. Copy `.env.example` to `.env` and fill the required values.
2. Build and start on an ARM64 VPS:

```bash
DOCKER_PLATFORM=linux/arm64 docker compose up --build -d
```

3. If you want to build the app image only:

```bash
docker build --platform linux/arm64 -t balance-app:latest .
```

If the VPS itself is already ARM64, Docker will build the correct architecture natively. The `DOCKER_PLATFORM` variable is kept in Compose so the target platform stays explicit.

## Notes

- The core UI now reads and writes live data for auth, wallets, transactions, budgets, templates, and settlements.
- Member invitation email delivery is not yet wired to outbound SMTP logic in the app layer, although the database model already supports invitations.
