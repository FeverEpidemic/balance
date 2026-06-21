-- 0011: Security fixes
-- Fix 1: Lock down ensure_balance_adjustment_category RPC
-- Fix 3: Owner-only invite token visibility
-- Fix 4: Restrict direct wallet member inserts

-- ============================================================
-- Fix 1: ensure_balance_adjustment_category — remove
-- actor_user_id param, enforce wallet role gate, use auth.uid()
-- ============================================================

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
  resolved_actor_id uuid;
  category_id uuid;
  category_name text;
  category_color text;
begin
  if not private.has_wallet_role(target_wallet_id, array['owner','editor']::public.wallet_role[]) then
    raise exception 'balance_adjustment_forbidden';
  end if;

  resolved_actor_id := auth.uid();

  if resolved_actor_id is null then
    resolved_actor_id := (select owner_user_id from public.wallets where id = target_wallet_id);
  end if;

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

revoke execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid) from authenticated;
revoke execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid) from service_role;
grant execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind) to authenticated;

-- ============================================================
-- Fix 3: Restrict invite token visibility — owner-only SELECT
-- ============================================================

drop policy if exists "wallet_invitations_select_wallet_members" on public.wallet_invitations;

create policy "wallet_invitations_select_owners" on public.wallet_invitations
for select to authenticated
using (private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]));

-- ============================================================
-- Fix 4: Restrict direct wallet member inserts — only wallet
-- creator inserting themselves as owner at creation time
-- ============================================================

drop policy if exists "wallet_members_insert_owner" on public.wallet_members;

create policy "wallet_members_insert_owner" on public.wallet_members
for insert to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and exists (
    select 1 from public.wallets w
    where w.id = wallet_id and w.owner_user_id = auth.uid()
  )
);
