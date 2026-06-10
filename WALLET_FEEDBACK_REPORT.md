This report is provided as-is, no guarantees of accuracy are provided, I am not a security expert. I disclaim all responsibility for damages leading from this report.

# Bug Report: Public Security-Definer RPC Bypasses Wallet Authorization

## Summary

`balance/supabase/migrations/0010_transaction_balance_adjustments.sql` defines `public.ensure_balance_adjustment_category` as a `security definer` function and grants it to `authenticated` users. The function accepts a caller-supplied `target_wallet_id` and `actor_user_id`, but it does not verify that `auth.uid()` is a member of the target wallet or has an owner/editor role.

As a result, any signed-in Supabase user can call the public RPC directly through Supabase/PostgREST and mutate `public.categories` for a wallet they do not control, if they know or obtain the target wallet UUID.

## Severity

High.

This is a database-layer authorization bypass. Next.js server actions and app routes generally check membership before wallet access, but those checks do not protect a public Supabase RPC endpoint that can be called directly by an authenticated user.

## Affected Project

Repository path: `balance/`

Relevant files:

- `balance/supabase/migrations/0010_transaction_balance_adjustments.sql`
- `balance/app/actions/transactions.ts`
- `balance/supabase/migrations/0008_saving_entry_transactions.sql`
- `balance/supabase/migrations/0003_fix_wallet_rls_recursion.sql`

## Vulnerable Function

Defined in `balance/supabase/migrations/0010_transaction_balance_adjustments.sql`:

```sql
create or replace function public.ensure_balance_adjustment_category(
  target_wallet_id uuid,
  target_kind public.transaction_kind,
  actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  resolved_actor_id uuid;
  category_id uuid;
  category_name text;
  category_color text;
begin
  select coalesce(actor_user_id, w.owner_user_id)
    into resolved_actor_id
  from public.wallets w
  where w.id = target_wallet_id;

  if resolved_actor_id is null then
    raise exception 'wallet_not_found';
  end if;

  if target_kind = 'income' then
    category_name := 'Penyesuaian Saldo Masuk';
    category_color := '#6f8f78';
  else
    category_name := 'Penyesuaian Saldo Keluar';
    category_color := '#8e7558';
  end if;

  select c.id
    into category_id
  from public.categories c
  where c.wallet_id = target_wallet_id
    and c.kind = target_kind
    and c.name = category_name
  limit 1;

  if category_id is not null then
    return category_id;
  end if;

  insert into public.categories (
    wallet_id,
    name,
    kind,
    color,
    is_system,
    created_by,
    updated_by
  )
  values (
    target_wallet_id,
    category_name,
    target_kind,
    category_color,
    true,
    resolved_actor_id,
    resolved_actor_id
  )
  on conflict (wallet_id, name, kind)
  do update
  set
    is_system = true,
    updated_by = excluded.updated_by
  returning id
  into category_id;

  return category_id;
end;
$$;
```

The same migration grants direct execute access:

```sql
grant execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid) to authenticated;
grant execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid) to service_role;
```

## Why This Is Vulnerable

The function is `security definer`, so the function body runs with the privileges of the function owner rather than the caller. This lets it read `public.wallets` and insert/update `public.categories` even when normal row-level security policies would prevent the caller from doing that directly.

The function does not perform any of the required wallet authorization checks:

- It does not require `auth.uid()` to be non-null.
- It does not call `private.has_wallet_role(target_wallet_id, array['owner','editor'])`.
- It trusts a caller-provided `actor_user_id`.
- It is granted to all `authenticated` users.

The normal RLS policy on categories is not enough here. `public.categories` has a policy that only lets owners/editors mutate categories, but this RPC bypasses that policy boundary because the mutation occurs inside a security-definer function.

## Existing Authorization Helper

`balance/supabase/migrations/0003_fix_wallet_rls_recursion.sql` defines the helper that should be used:

```sql
create or replace function private.has_wallet_role(
  target_wallet_id uuid,
  allowed_roles public.wallet_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.wallet_members wm
    where wm.wallet_id = target_wallet_id
      and wm.user_id = auth.uid()
      and wm.role = any (allowed_roles)
  );
$$;
```

This is already used by RLS policies and by other RPCs.

## Safe Pattern Already Present

`balance/supabase/migrations/0008_saving_entry_transactions.sql` defines `public.create_saving_entry_with_transaction` using the safer pattern:

```sql
declare
  created_entry_id uuid;
  actor_user_id uuid := auth.uid();
begin
  if actor_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.has_wallet_role(target_wallet_id, array['owner', 'editor']::public.wallet_role[]) then
    raise exception 'saving_entry_forbidden';
  end if;

  -- write operations happen only after authz succeeds
end;
```

That migration also revokes broad execute access before granting the intended role:

```sql
revoke all on function public.create_saving_entry_with_transaction(uuid, uuid, public.saving_entry_type, numeric, timestamptz, text, uuid) from public, anon, authenticated;
grant execute on function public.create_saving_entry_with_transaction(uuid, uuid, public.saving_entry_type, numeric, timestamptz, text, uuid) to authenticated;
```

`ensure_balance_adjustment_category` should follow the same database-side authorization pattern.

## App-Level Call Site

`balance/app/actions/transactions.ts` calls the vulnerable RPC through the normal authenticated Supabase client:

```ts
async function ensureBalanceAdjustmentCategory(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string,
  kind: "income" | "expense",
  userId: string
) {
  const { data, error } = await supabase.rpc("ensure_balance_adjustment_category", {
    target_wallet_id: walletId,
    target_kind: kind,
    actor_user_id: userId
  });

  if (error || !data) {
    return null;
  }

  return data as string;
}
```

The app obtains `user.id` from `requireUser()`, but this does not secure the RPC itself. A public Supabase user can call the RPC directly without using this server action.

## Direct Exploit Path

Prerequisites:

- The attacker has any valid signed-in Supabase session for the project.
- The attacker knows a target wallet UUID.
- The target wallet lacks one of the fixed balance adjustment categories, or the attacker wants to force/update the existing system category metadata.

Direct HTTP request through Supabase/PostgREST:

```bash
curl -i "$SUPABASE_URL/rest/v1/rpc/ensure_balance_adjustment_category" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_wallet_id": "VICTIM_WALLET_UUID",
    "target_kind": "expense",
    "actor_user_id": "ATTACKER_OR_ARBITRARY_USER_UUID"
  }'
```

Equivalent Supabase JS call from any authenticated client session:

```ts
const { data, error } = await supabase.rpc("ensure_balance_adjustment_category", {
  target_wallet_id: "VICTIM_WALLET_UUID",
  target_kind: "expense",
  actor_user_id: "ATTACKER_OR_ARBITRARY_USER_UUID"
});
```

Expected vulnerable behavior:

- If the wallet exists and the matching balance-adjustment category does not exist, the RPC inserts a category in the victim wallet.
- If the category exists, the RPC returns its UUID.
- On conflict, the RPC updates `is_system = true` and `updated_by = excluded.updated_by`.

Normal table reads still appear to be RLS-protected, so this does not obviously allow arbitrary wallet enumeration. The practical exploit depends on knowing or obtaining a wallet UUID.

## Possible Anonymous Exposure Check

PostgreSQL grants `EXECUTE` on functions to `PUBLIC` by default unless default privileges or explicit revokes changed that. This migration does not explicitly revoke `PUBLIC`, `anon`, or `authenticated` before granting `authenticated`.

Check the deployed database with:

```sql
select
  has_function_privilege('anon', 'public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid)', 'execute') as anon_can_execute,
  has_function_privilege('authenticated', 'public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid)', 'execute') as authenticated_can_execute;
```

Even if `anon_can_execute` is false in the deployed project, `authenticated_can_execute` is explicitly true from the migration and is enough for the reported issue.

## Recommended Fix

Add a new Supabase migration that fixes authorization at the database layer.

Recommended approach:

1. Revoke execute on the existing public signature from `public`, `anon`, and `authenticated`.
2. Stop accepting caller-controlled `actor_user_id`, or keep the argument only for backwards compatibility but ignore it.
3. Derive the actor from `auth.uid()` inside the function.
4. Reject unauthenticated callers.
5. Require `private.has_wallet_role(target_wallet_id, array['owner','editor'])` before any wallet/category reads or writes that should be authorized.
6. Grant execute only to the roles that should call it.
7. Update `balance/app/actions/transactions.ts` to stop sending `actor_user_id` if the function signature changes.

Example migration direction if changing to a two-argument function:

```sql
revoke all on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid) from public, anon, authenticated, service_role;
drop function if exists public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid);

create or replace function public.ensure_balance_adjustment_category(
  target_wallet_id uuid,
  target_kind public.transaction_kind
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := auth.uid();
  category_id uuid;
  category_name text;
  category_color text;
begin
  if actor_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.has_wallet_role(target_wallet_id, array['owner', 'editor']::public.wallet_role[]) then
    raise exception 'balance_adjustment_category_forbidden';
  end if;

  if target_kind = 'income' then
    category_name := 'Penyesuaian Saldo Masuk';
    category_color := '#6f8f78';
  else
    category_name := 'Penyesuaian Saldo Keluar';
    category_color := '#8e7558';
  end if;

  select c.id
    into category_id
  from public.categories c
  where c.wallet_id = target_wallet_id
    and c.kind = target_kind
    and c.name = category_name
  limit 1;

  if category_id is not null then
    return category_id;
  end if;

  insert into public.categories (
    wallet_id,
    name,
    kind,
    color,
    is_system,
    created_by,
    updated_by
  )
  values (
    target_wallet_id,
    category_name,
    target_kind,
    category_color,
    true,
    actor_user_id,
    actor_user_id
  )
  on conflict (wallet_id, name, kind)
  do update
  set
    is_system = true,
    updated_by = actor_user_id
  returning id
  into category_id;

  return category_id;
end;
$$;

revoke all on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind) from public, anon, authenticated;
grant execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind) to authenticated;
grant execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind) to service_role;
```

If preserving the existing three-argument signature for compatibility, keep the parameter but do not use it:

```sql
actor_user_id uuid := auth.uid();
```

Do not trust `actor_user_id` from RPC input.

## App Update If Signature Changes

Update `balance/app/actions/transactions.ts` so the helper no longer accepts or sends `user.id`:

```ts
async function ensureBalanceAdjustmentCategory(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string,
  kind: "income" | "expense"
) {
  const { data, error } = await supabase.rpc("ensure_balance_adjustment_category", {
    target_wallet_id: walletId,
    target_kind: kind
  });

  if (error || !data) {
    return null;
  }

  return data as string;
}
```

Then update both call sites in `createBalanceAdjustment` and `updateTransaction` to remove the `user.id` argument.

## Verification Plan

Before the fix, confirm the vulnerability with two users:

1. Create or identify wallet A owned by user A.
2. Sign in as user B, who is not a member of wallet A.
3. Call `public.ensure_balance_adjustment_category` with wallet A's UUID using user B's access token.
4. Observe that the RPC succeeds or inserts/returns a category ID.

After the fix:

1. The same direct RPC call as user B should fail with `balance_adjustment_category_forbidden` or an equivalent authorization error.
2. The same RPC call as wallet A owner/editor should succeed.
3. A wallet viewer should fail.
4. App flows for creating balance adjustments should still work for owners/editors.
5. App flows should fail cleanly for viewers/non-members.
6. Confirm function privileges:

```sql
select
  has_function_privilege('anon', 'public.ensure_balance_adjustment_category(uuid, public.transaction_kind)', 'execute') as anon_can_execute,
  has_function_privilege('authenticated', 'public.ensure_balance_adjustment_category(uuid, public.transaction_kind)', 'execute') as authenticated_can_execute;
```

Expected result after a two-argument fix:

- `anon_can_execute = false`
- `authenticated_can_execute = true`

The `authenticated` grant is acceptable only if the function itself performs the `auth.uid()` and wallet role checks before writing.

## Acceptance Criteria

- Direct public RPC calls cannot create, update, or discover balance-adjustment categories for wallets where the caller is not an owner/editor.
- The function derives actor identity from `auth.uid()` and no longer trusts caller-supplied `actor_user_id`.
- The old vulnerable three-argument RPC signature is removed or made safe.
- Function execute privileges are explicit and do not unintentionally include `anon`/`PUBLIC`.
- Existing balance-adjustment creation and editing flows continue to work for wallet owners/editors.
