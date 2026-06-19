# Post-Audit Fix Plan

> **Executor options:**
> - **Hermes** — execute task-by-task
> - **Manual** — follow steps directly

**Goal:** Fix all vulnerabilities and code quality issues found in the open source audit, ordered by severity.

**Architecture:** SQL migrations for database fixes, code changes for app fixes, CI/config updates for infra fixes.

---

## 🔴 Critical (Fix Immediately)

### Fix 1: Add membership check to `get_wallet_balances` RPC

**Objective:** Prevent any authenticated user from reading any wallet's balance.

**Files:**
- Create: `supabase/migrations/0022_fix_wallet_balance_rpc_membership.sql`
- Verify: `supabase/migrations/0018_wallet_balance_rpc.sql`

**Current issue:**
The RPC `get_wallet_balances` is `security definer` with no membership check. Any authenticated user can query any wallet's balance.

**Fix:**
```sql
-- supabase/migrations/0022_fix_wallet_balance_rpc_membership.sql
-- Fix get_wallet_balances to verify wallet membership

create or replace function public.get_wallet_balances(wallet_ids uuid[])
returns table (wallet_id uuid, balance bigint)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    w.id,
    w.current_balance
  from public.wallets w
  where w.id = any(wallet_ids)
    and private.is_wallet_member(w.id);
end;
$$;

-- Also ensure the function is only callable by authenticated users (not public)
revoke execute on function public.get_wallet_balances(uuid[]) from public;
grant execute on function public.get_wallet_balances(uuid[]) to authenticated;
```

**Verification:**
- Run migration against a test Supabase instance
- Verify an authenticated user who is NOT a wallet member gets empty result set
- Verify a wallet member gets the correct balance

**Commit:**
```bash
git add supabase/migrations/0022_fix_wallet_balance_rpc_membership.sql
git commit -m "fix: add membership check to get_wallet_balances RPC to prevent data leak"
git push
```

---

### Fix 2: Drop stale auth-bypass RPC function

**Objective:** Remove the old 3-parameter `ensure_balance_adjustment_category` that was partially deprecated.

**Files:**
- Create: `supabase/migrations/0023_cleanup_stale_rpc_functions.sql`

**Fix:**
```sql
-- supabase/migrations/0023_cleanup_stale_rpc_functions.sql
-- Drop old 3-parameter RPC function that was deprecated in migration 0011

drop function if exists public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid);
```

**Verification:**
```bash
# Verify the function is gone
psql -d your_db -c "\df public.ensure_balance_adjustment_category"
# Expected: "Did not find any function named ..."
```

**Note:** Also add a check for any other stale utility functions that might exist but aren't used.

**Commit:**
```bash
git add supabase/migrations/0023_cleanup_stale_rpc_functions.sql
git commit -m "fix: drop stale auth-bypass RPC function ensure_balance_adjustment_category"
git push
```

---

### Fix 3: Per-table grants instead of blanket GRANT (Documentation + Future-proofing)

**Objective:** Document the risk of the blanket GRANT and add a future migration to tighten it.

**Note:** This is a structural change that affects existing behavior. The blanket GRANT is standard Supabase practice. The fix is to:

1. Document the risk in the README and AGENTS.md
2. Add a migration comment explaining the dependency
3. Add a CI check that verifies RLS is enabled on all tables

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/ENGINEERING.md`
- Create: `.github/workflows/check-rls.yml` (optional GitHub Action)

**AGENTS.md addition:**
```markdown
## Security: RLS Dependency

All tables rely on Row Level Security (RLS) for data isolation. A blanket
`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES ... TO authenticated`
is applied in migration 0001, meaning **any table without RLS enabled is
publicly writable/readable by all authenticated users**.

When adding a new table:
1. Always run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. Create at least one RLS policy before any data is inserted
3. Verify with `SELECT relname FROM pg_class WHERE relrowsecurity = false;`
```

**Commit:**
```bash
git add AGENTS.md docs/ENGINEERING.md
git commit -m "docs: document RLS dependency and blanket GRANT risk"
git push
```

---

## 🟠 High Priority

### Fix 4: Fix CI workflow Node version

**Objective:** Match CI Node version to project requirements.

**Files:**
- Modify: `.github/workflows/ci.yml`

**Change:** `node-version: 20` → `node-version: 22`

**Verification:**
```bash
grep -n "node-version" .github/workflows/ci.yml
# Expected: node-version: 22
```

**Commit:**
```bash
git add .github/workflows/ci.yml
git commit -m "fix: bump CI Node version from 20 to 22 to match engines requirement"
git push
```

---

### Fix 5: Add required env vars to CI build step

**Objective:** Prevent CI build failure due to missing Supabase URL/key.

**Files:**
- Modify: `.github/workflows/ci.yml`

**Change:** Add dummy values for Supabase env vars in the build step:

```yaml
    - name: Build
      run: npm run build
      env:
        NEXT_PUBLIC_SITE_URL: http://localhost:3000
        NEXT_PUBLIC_SUPABASE_URL: http://localhost:8000
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: dummy_for_ci
        SUPABASE_SECRET_KEY: dummy_for_ci
        DEEPSEEK_API_KEY: dummy_for_ci
```

**Commit:**
```bash
git add .github/workflows/ci.yml
git commit -m "fix: add required env vars to CI build step to prevent build failure"
git push
```

---

### Fix 6: Add init SQL migration for blank Supabase projects

**Objective:** New users can run one file to initialize the complete schema.

**Files:**
- Create: `supabase/init.sql` (not a numbered migration — it's a convenience file)

**Fix:** Concatenate all 23 migrations into a single `supabase/init.sql` file:

```bash
cd supabase/migrations
cat *.sql > ../init.sql
```

Then update README to mention the init.sql option:

```markdown
### Quick Setup (New Projects)

For a blank Supabase project, run the complete schema in one step:

```bash
# Option A: supabase db push (recommended)
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Option B: Run init.sql directly in Supabase SQL Editor
# Copy the contents of supabase/init.sql and paste into SQL Editor
```
```

**Commit:**
```bash
git add supabase/init.sql README.md
git commit -m "docs: add init.sql for one-step schema setup on blank projects"
git push
```

---

### Fix 7: Use `${SELF_HOSTED_MODE:-true}` in docker-compose.yml

**Objective:** Allow users to override SELF_HOSTED_MODE from their `.env` file without editing docker-compose.yml.

**Files:**
- Modify: `docker-compose.yml`

**Change:**
```yaml
    environment:
      NODE_ENV: production
      SELF_HOSTED_MODE: ${SELF_HOSTED_MODE:-true}
```

**Verification:**
```bash
grep "SELF_HOSTED_MODE" docker-compose.yml
# Expected: SELF_HOSTED_MODE: ${SELF_HOSTED_MODE:-true}
```

**Commit:**
```bash
git add docker-compose.yml
git commit -m "fix: use ${SELF_HOSTED_MODE:-true} so users can override via .env"
git push
```

---

### Fix 8: Fix REDIS_URL placeholder in .env.example

**Objective:** Remove confusing `***` and `balance.local` from Redis URL example.

**Files:**
- Modify: `.env.example`

**Change:**
```env
# Redis connection URL. Leave empty to disable Redis.
# Format: redis://[user:password@]host:port
# Local self-hosted: redis://redis:6379 (no auth)
REDIS_URL=redis://redis:6379
```

**Commit:**
```bash
git add .env.example
git commit -m "fix: clean up Redis URL placeholder in env example"
git push
```

---

## 🟡 Medium Priority

### Fix 9: Wire up login rate limiting

**Objective:** Prevent brute-force login attacks.

**Files:**
- Find: Auth server action (likely `app/actions/auth.ts` or login page server action)
- Modify: Auth action + verify `consumeLoginRateLimit` import

**Steps:**
1. Find the login server action
2. Import `consumeLoginRateLimit` from `@/lib/rate-limit`
3. Add rate limit check before password verification
4. Use the client's IP address (from `headers()` or `request`)

**Implementation sketch:**
```typescript
import { consumeLoginRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

// In login action:
const headerStore = await headers();
const ip = headerStore.get("x-forwarded-for") ?? headerStore.get("x-real-ip") ?? "unknown";
const rateLimitResult = await consumeLoginRateLimit(ip);

if (!rateLimitResult.allowed) {
  return { error: "Terlalu banyak percobaan login. Silakan coba lagi nanti." };
}
```

**Commit:**
```bash
git add app/actions/auth.ts
git commit -m "fix: wire up login rate limiting to prevent brute-force attacks"
git push
```

---

### Fix 10: Move support email to env var

**Objective:** Allow self-hosters to customize the support contact.

**Files:**
- Modify: `lib/env.ts` — add `getSupportEmail()`
- Modify: `lib/changelogs.ts` — use `getSupportEmail()`
- Modify: Any other file with hardcoded `support@mybalance.my.id`

**Implementation:**
```typescript
// lib/env.ts
export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || "support@mybalance.my.id";
}
```

```env
# .env.example
SUPPORT_EMAIL=support@mybalance.my.id
```

**Commit:**
```bash
git add lib/env.ts lib/changelogs.ts .env.example
git commit -m "feat: make support email configurable via env var"
git push
```

---

### Fix 11: Document SELF_HOSTED_MODE auto-detect behavior

**Objective:** Make the auto-detect heuristic clear in README so users aren't confused.

**Files:**
- Modify: `README.md`

**Add section:**
```markdown
## 🏠 Self-Hosted Mode

Balance auto-detects whether it's running as self-hosted or SaaS:

1. If `SELF_HOSTED_MODE` env var is explicitly set to `true` or `false`, it's honored.
2. If not set, it checks whether `MIDTRANS_SERVER_KEY` is configured.
   - **Midtrans key missing or placeholder** → treated as self-hosted (all features unlocked)
   - **Midtrans key present** → treated as SaaS (subscription-gated features)

To explicitly enable self-hosted mode:
```env
SELF_HOSTED_MODE=true
```

To explicitly enable SaaS mode (requires Midtrans):
```env
SELF_HOSTED_MODE=false
MIDTRANS_SERVER_KEY=your_real_key
```
```

**Commit:**
```bash
git add README.md
git commit -m "docs: document SELF_HOSTED_MODE auto-detect behavior"
git push
```

---

### Fix 12: Clean up lib/features.ts — use imported readBooleanEnv

**Objective:** Remove duplicated `readBooleanEnv` in features.ts.

**Files:**
- Modify: `lib/features.ts`

**Change:** Remove the local `readBooleanEnv` function and import from env.ts.

Since `isSelfHosted()` now uses `process.env` directly instead of `readBooleanEnv`, the local `readBooleanEnv` is no longer used. Simply delete it.

**Commit:**
```bash
git add lib/features.ts
git commit -m "refactor: remove unused readBooleanEnv from features.ts (now imported from env.ts)"
git push
```

---

## Summary of Files Changed

| File | Action | Fix |
|------|--------|-----|
| `supabase/migrations/0022_fix_wallet_balance_rpc_membership.sql` | **Create** | 🔴 Fix RPC data leak |
| `supabase/migrations/0023_cleanup_stale_rpc_functions.sql` | **Create** | 🔴 Drop stale RPC |
| `AGENTS.md` | **Modify** | 🔴 Document RLS risk |
| `docs/ENGINEERING.md` | **Modify** | 🔴 Document RLS risk |
| `.github/workflows/ci.yml` | **Modify** | 🟠 Fix Node 20→22 + env vars |
| `supabase/init.sql` | **Create** | 🟠 One-step schema init |
| `README.md` | **Modify** | 🟠 + 🟡 init.sql + auto-detect docs |
| `docker-compose.yml` | **Modify** | 🟠 Fix hardcoded SELF_HOSTED_MODE |
| `.env.example` | **Modify** | 🟠 Fix Redis URL + 🟡 support email |
| `lib/env.ts` | **Modify** | 🟡 Add getSupportEmail() |
| `lib/changelogs.ts` | **Modify** | 🟡 Use env var for email |
| `lib/features.ts` | **Modify** | 🟡 Remove dead code |
| `app/actions/auth.ts` (or similar) | **Modify** | 🟡 Wire up login rate limit |

**Estimated effort:** ~3-4 hours of focused work.
