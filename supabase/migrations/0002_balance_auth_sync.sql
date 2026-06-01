create schema if not exists private;
revoke all on schema private from public;

create or replace function private.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, email, default_currency)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'IDR'
  )
  on conflict (id) do update
  set
    full_name = coalesce(new.raw_user_meta_data ->> 'full_name', public.profiles.full_name),
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_synced on auth.users;
create trigger on_auth_user_synced
after insert or update on auth.users
for each row
execute function private.handle_auth_user_sync();

insert into public.profiles (id, full_name, email, default_currency)
select
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  u.email,
  'IDR'
from auth.users u
on conflict (id) do update
set
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  email = excluded.email,
  updated_at = timezone('utc', now());

drop policy if exists "wallets_select_members" on public.wallets;
create policy "wallets_select_members_or_owner" on public.wallets
for select to authenticated
using (public.is_wallet_member(id) or owner_user_id = auth.uid());

drop policy if exists "wallet_members_insert_owner" on public.wallet_members;
create policy "wallet_members_insert_owner" on public.wallet_members
for insert to authenticated
with check (
  public.has_wallet_role(wallet_id, array['owner']::public.wallet_role[])
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
