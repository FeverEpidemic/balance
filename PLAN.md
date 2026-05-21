# Personal Finance App MVP Plan

## Summary

Build a Bahasa Indonesia responsive web app for household personal finance with personal accounts and shareable wallets.

MVP includes:
- Expense and income tracking
- Per-wallet categories and monthly budgets
- Split bill with equal and custom amounts
- Manual settlements
- Transaction templates
- Member roles
- Monthly reporting

Tech defaults:
- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: fully self-hosted Supabase
- Runtime: Docker Compose on VPS
- Auth: email/password with external SMTP
- Currency: IDR only
- UI language: Bahasa Indonesia

## Key Implementation Changes

- Scaffold a new Next.js app with authenticated dashboard routes, responsive layout, and mobile-first transaction entry.
- Add Supabase self-host deployment using Docker Compose, including app service, Supabase services, reverse proxy, environment config, and daily Postgres backup.
- Implement Supabase schema with Row Level Security for profiles, wallets, members, invitations, categories, budgets, transactions, splits, settlements, and templates.
- Use wallet membership roles:
  - Owner: manage wallet, members, and all finance data.
  - Editor: create and update finance records.
  - Viewer: read-only access.
- Keep wallets private by default. Only invited members can access shared wallet data.

## Core Product Flows

- Register and login with email/password.
- Create personal or shared wallet.
- Invite wallet member by email.
- Accept invite after login or registration.
- Add income or expense quickly from mobile web.
- Add split details for shared expenses.
- Record manual settlement between members.
- Create monthly category budget.
- View monthly reports by category, member, and budget usage.
- Reuse transaction templates without automatic recurring generation.

## Data Model

Core tables:
- `profiles`
- `wallets`
- `wallet_members`
- `wallet_invitations`
- `categories`
- `budgets`
- `transactions`
- `transaction_splits`
- `settlements`
- `transaction_templates`

Audit fields:
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`

Full audit log is out of scope for MVP.

## Routes

Public:
- `/login`
- `/register`
- `/invite/[token]`

Authenticated:
- `/dashboard`
- `/wallets`
- `/wallets/[walletId]`
- `/wallets/[walletId]/transactions`
- `/wallets/[walletId]/budgets`
- `/wallets/[walletId]/reports`
- `/wallets/[walletId]/members`
- `/wallets/[walletId]/settlements`
- `/wallets/[walletId]/templates`

## Test Plan

Auth:
- Register, login, logout, and protected route redirects.
- Invite acceptance for existing and newly registered users.

Security:
- User cannot access private wallets where they are not a member.
- Viewer cannot mutate wallet data.
- Editor cannot manage members.
- Owner can manage all wallet records.

Finance behavior:
- Income, expense, category, and budget totals calculate correctly in IDR.
- Equal split and custom split produce correct balances.
- Manual settlement reduces outstanding balance correctly.
- Templates can be reused without creating automatic transactions.

UI:
- Transaction entry works well on mobile viewport.
- Reports render correctly for empty, partial, and populated months.

Deployment:
- Docker Compose boots all required services.
- Supabase auth email works with external SMTP.
- Daily Postgres backup job creates usable backup files.

## Assumptions

- MVP excludes bank import, payment gateway integration, automatic recurring transactions, multi-currency, advanced split rules, and full audit log.
- Supabase is fully self-hosted on the VPS.
- SMTP credentials, VPS domain, TLS setup, and production secrets are provided via environment variables.
- Initial backup target is local or attached VPS storage. Object storage backup can be added later.