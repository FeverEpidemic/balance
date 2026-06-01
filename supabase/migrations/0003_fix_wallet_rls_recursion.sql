create schema if not exists private;
revoke all on schema private from public;

create or replace function private.is_wallet_member(target_wallet_id uuid)
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
  );
$$;

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

grant usage on schema private to authenticated;
grant execute on function private.is_wallet_member(uuid) to authenticated;
grant execute on function private.has_wallet_role(uuid, public.wallet_role[]) to authenticated;

drop policy if exists "wallets_select_members" on public.wallets;
drop policy if exists "wallets_select_members_or_owner" on public.wallets;
create policy "wallets_select_members_or_owner" on public.wallets
for select to authenticated
using (private.is_wallet_member(id) or owner_user_id = auth.uid());

drop policy if exists "wallets_update_owner" on public.wallets;
create policy "wallets_update_owner" on public.wallets
for update to authenticated
using (private.has_wallet_role(id, array['owner']::public.wallet_role[]))
with check (private.has_wallet_role(id, array['owner']::public.wallet_role[]));

drop policy if exists "wallet_members_select_members" on public.wallet_members;
create policy "wallet_members_select_members" on public.wallet_members
for select to authenticated
using (private.is_wallet_member(wallet_id));

drop policy if exists "wallet_members_insert_owner" on public.wallet_members;
create policy "wallet_members_insert_owner" on public.wallet_members
for insert to authenticated
with check (
  private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[])
  or (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.wallets w
      where w.id = wallet_id
        and w.owner_user_id = auth.uid()
    )
  )
);

drop policy if exists "wallet_members_update_owner" on public.wallet_members;
create policy "wallet_members_update_owner" on public.wallet_members
for update to authenticated
using (private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]));

drop policy if exists "wallet_invitations_select_wallet_members" on public.wallet_invitations;
create policy "wallet_invitations_select_wallet_members" on public.wallet_invitations
for select to authenticated
using (
  private.is_wallet_member(wallet_id)
  or lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

drop policy if exists "wallet_invitations_insert_owner" on public.wallet_invitations;
create policy "wallet_invitations_insert_owner" on public.wallet_invitations
for insert to authenticated
with check (private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]));

drop policy if exists "wallet_invitations_update_owner_or_invited" on public.wallet_invitations;
create policy "wallet_invitations_update_owner_or_invited" on public.wallet_invitations
for update to authenticated
using (
  private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[])
  or lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
)
with check (
  private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[])
  or lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

drop policy if exists "categories_select_members" on public.categories;
create policy "categories_select_members" on public.categories
for select to authenticated
using (private.is_wallet_member(wallet_id));

drop policy if exists "categories_mutate_editors" on public.categories;
create policy "categories_mutate_editors" on public.categories
for all to authenticated
using (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

drop policy if exists "budgets_select_members" on public.budgets;
create policy "budgets_select_members" on public.budgets
for select to authenticated
using (private.is_wallet_member(wallet_id));

drop policy if exists "budgets_mutate_editors" on public.budgets;
create policy "budgets_mutate_editors" on public.budgets
for all to authenticated
using (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

drop policy if exists "transactions_select_members" on public.transactions;
create policy "transactions_select_members" on public.transactions
for select to authenticated
using (private.is_wallet_member(wallet_id));

drop policy if exists "transactions_mutate_editors" on public.transactions;
create policy "transactions_mutate_editors" on public.transactions
for all to authenticated
using (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

drop policy if exists "transaction_splits_select_members" on public.transaction_splits;
create policy "transaction_splits_select_members" on public.transaction_splits
for select to authenticated
using (private.is_wallet_member(wallet_id));

drop policy if exists "transaction_splits_mutate_editors" on public.transaction_splits;
create policy "transaction_splits_mutate_editors" on public.transaction_splits
for all to authenticated
using (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

drop policy if exists "settlements_select_members" on public.settlements;
create policy "settlements_select_members" on public.settlements
for select to authenticated
using (private.is_wallet_member(wallet_id));

drop policy if exists "settlements_mutate_editors" on public.settlements;
create policy "settlements_mutate_editors" on public.settlements
for all to authenticated
using (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

drop policy if exists "templates_select_members" on public.transaction_templates;
create policy "templates_select_members" on public.transaction_templates
for select to authenticated
using (private.is_wallet_member(wallet_id));

drop policy if exists "templates_mutate_editors" on public.transaction_templates;
create policy "templates_mutate_editors" on public.transaction_templates
for all to authenticated
using (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));
