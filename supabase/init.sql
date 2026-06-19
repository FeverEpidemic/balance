create extension if not exists pgcrypto;

create type public.wallet_kind as enum ('personal', 'shared');
create type public.wallet_role as enum ('owner', 'editor', 'viewer');
create type public.transaction_kind as enum ('income', 'expense');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
create type public.split_type as enum ('equal', 'custom');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  default_currency text not null default 'IDR',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.wallet_kind not null,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

create table public.wallet_members (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.wallet_role not null default 'viewer',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  unique (wallet_id, user_id)
);

create table public.wallet_invitations (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  invited_email text not null,
  role public.wallet_role not null default 'viewer',
  token text not null unique,
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references public.profiles(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  name text not null,
  kind public.transaction_kind not null,
  color text not null default '#595f3d',
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  unique (wallet_id, name, kind)
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month_start date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  unique (wallet_id, category_id, month_start)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  kind public.transaction_kind not null,
  amount numeric(14, 2) not null check (amount > 0),
  happened_at timestamptz not null default timezone('utc', now()),
  note text,
  merchant text,
  split_type public.split_type,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

create table public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  member_user_id uuid not null references public.profiles(id) on delete cascade,
  owed_amount numeric(14, 2) not null check (owed_amount >= 0),
  paid_amount numeric(14, 2) not null default 0 check (paid_amount >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  unique (transaction_id, member_user_id)
);

create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  payer_user_id uuid not null references public.profiles(id) on delete cascade,
  payee_user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  happened_at timestamptz not null default timezone('utc', now()),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

create table public.transaction_templates (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  kind public.transaction_kind not null,
  default_amount numeric(14, 2) check (default_amount >= 0),
  note text,
  split_type public.split_type,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  unique (wallet_id, name)
);

create or replace function public.is_wallet_member(target_wallet_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.wallet_members wm
    where wm.wallet_id = target_wallet_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.has_wallet_role(target_wallet_id uuid, allowed_roles public.wallet_role[])
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.wallet_members wm
    where wm.wallet_id = target_wallet_id
      and wm.user_id = auth.uid()
      and wm.role = any (allowed_roles)
  );
$$;

create index idx_wallet_members_user_wallet on public.wallet_members (user_id, wallet_id);
create index idx_wallet_invitations_wallet_email on public.wallet_invitations (wallet_id, invited_email);
create index idx_categories_wallet_kind on public.categories (wallet_id, kind);
create index idx_budgets_wallet_month on public.budgets (wallet_id, month_start);
create index idx_transactions_wallet_happened_at on public.transactions (wallet_id, happened_at desc);
create index idx_transaction_splits_wallet_member on public.transaction_splits (wallet_id, member_user_id);
create index idx_settlements_wallet_happened_at on public.settlements (wallet_id, happened_at desc);
create index idx_templates_wallet_kind on public.transaction_templates (wallet_id, kind);

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_wallets_updated_at before update on public.wallets for each row execute function public.set_updated_at();
create trigger set_wallet_members_updated_at before update on public.wallet_members for each row execute function public.set_updated_at();
create trigger set_wallet_invitations_updated_at before update on public.wallet_invitations for each row execute function public.set_updated_at();
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger set_budgets_updated_at before update on public.budgets for each row execute function public.set_updated_at();
create trigger set_transactions_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create trigger set_transaction_splits_updated_at before update on public.transaction_splits for each row execute function public.set_updated_at();
create trigger set_settlements_updated_at before update on public.settlements for each row execute function public.set_updated_at();
create trigger set_transaction_templates_updated_at before update on public.transaction_templates for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_members enable row level security;
alter table public.wallet_invitations enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.transaction_templates enable row level security;

create policy "profiles_select_self" on public.profiles
for select to authenticated
using (id = auth.uid());

create policy "profiles_update_self" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "wallets_select_members" on public.wallets
for select to authenticated
using (public.is_wallet_member(id));

create policy "wallets_insert_owner" on public.wallets
for insert to authenticated
with check (owner_user_id = auth.uid() and created_by = auth.uid());

create policy "wallets_update_owner" on public.wallets
for update to authenticated
using (public.has_wallet_role(id, array['owner']::public.wallet_role[]))
with check (public.has_wallet_role(id, array['owner']::public.wallet_role[]));

create policy "wallet_members_select_members" on public.wallet_members
for select to authenticated
using (public.is_wallet_member(wallet_id));

create policy "wallet_members_insert_owner" on public.wallet_members
for insert to authenticated
with check (public.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]));

create policy "wallet_members_update_owner" on public.wallet_members
for update to authenticated
using (public.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]))
with check (public.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]));

create policy "wallet_invitations_select_wallet_members" on public.wallet_invitations
for select to authenticated
using (
  public.is_wallet_member(wallet_id)
  or lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

create policy "wallet_invitations_insert_owner" on public.wallet_invitations
for insert to authenticated
with check (public.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]));

create policy "wallet_invitations_update_owner_or_invited" on public.wallet_invitations
for update to authenticated
using (
  public.has_wallet_role(wallet_id, array['owner']::public.wallet_role[])
  or lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
)
with check (
  public.has_wallet_role(wallet_id, array['owner']::public.wallet_role[])
  or lower(invited_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

create policy "categories_select_members" on public.categories
for select to authenticated
using (public.is_wallet_member(wallet_id));

create policy "categories_mutate_editors" on public.categories
for all to authenticated
using (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

create policy "budgets_select_members" on public.budgets
for select to authenticated
using (public.is_wallet_member(wallet_id));

create policy "budgets_mutate_editors" on public.budgets
for all to authenticated
using (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

create policy "transactions_select_members" on public.transactions
for select to authenticated
using (public.is_wallet_member(wallet_id));

create policy "transactions_mutate_editors" on public.transactions
for all to authenticated
using (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

create policy "transaction_splits_select_members" on public.transaction_splits
for select to authenticated
using (public.is_wallet_member(wallet_id));

create policy "transaction_splits_mutate_editors" on public.transaction_splits
for all to authenticated
using (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

create policy "settlements_select_members" on public.settlements
for select to authenticated
using (public.is_wallet_member(wallet_id));

create policy "settlements_mutate_editors" on public.settlements
for all to authenticated
using (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

create policy "templates_select_members" on public.transaction_templates
for select to authenticated
using (public.is_wallet_member(wallet_id));

create policy "templates_mutate_editors" on public.transaction_templates
for all to authenticated
using (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (public.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
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
drop index if exists public.idx_wallet_invitations_wallet_email;

create index if not exists idx_wallet_invitations_wallet_status_created_at
  on public.wallet_invitations (wallet_id, status, created_at desc);

drop policy if exists "wallet_invitations_select_wallet_members" on public.wallet_invitations;
drop policy if exists "wallet_invitations_update_owner_or_invited" on public.wallet_invitations;

alter table public.wallet_invitations
  drop column if exists invited_email;

create policy "wallet_invitations_select_wallet_members" on public.wallet_invitations
for select to authenticated
using (private.is_wallet_member(wallet_id));

create policy "wallet_invitations_update_owner_or_invited" on public.wallet_invitations
for update to authenticated
using (private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]));
create or replace function private.wallet_member_limit()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 5;
$$;

create or replace function private.lock_wallet_capacity(target_wallet_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(target_wallet_id::text, 0));
end;
$$;

create or replace function private.wallet_member_count(target_wallet_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.wallet_members
  where wallet_id = target_wallet_id;
$$;

create or replace function private.wallet_pending_invitation_count(
  target_wallet_id uuid,
  excluded_invitation_id uuid default null
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.wallet_invitations
  where wallet_id = target_wallet_id
    and status = 'pending'
    and (excluded_invitation_id is null or id <> excluded_invitation_id);
$$;

create or replace function private.wallet_occupied_slots(
  target_wallet_id uuid,
  excluded_invitation_id uuid default null
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select private.wallet_member_count(target_wallet_id) + private.wallet_pending_invitation_count(target_wallet_id, excluded_invitation_id);
$$;

create or replace function private.raise_wallet_member_limit()
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using
    errcode = 'P0001',
    message = 'wallet_member_limit_reached';
end;
$$;

create or replace function private.enforce_wallet_invitation_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lock_wallet_capacity(new.wallet_id);

  if new.status = 'pending' and (tg_op = 'INSERT' or old.status is distinct from 'pending') then
    if private.wallet_occupied_slots(new.wallet_id, case when tg_op = 'UPDATE' then new.id else null end) >= private.wallet_member_limit() then
      perform private.raise_wallet_member_limit();
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.enforce_wallet_member_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lock_wallet_capacity(new.wallet_id);

  if tg_op = 'INSERT'
    or old.wallet_id is distinct from new.wallet_id
    or old.user_id is distinct from new.user_id then
    if private.wallet_occupied_slots(new.wallet_id) >= private.wallet_member_limit() then
      perform private.raise_wallet_member_limit();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists wallet_invitation_capacity_guard on public.wallet_invitations;
create trigger wallet_invitation_capacity_guard
before insert or update on public.wallet_invitations
for each row
execute function private.enforce_wallet_invitation_capacity();

drop trigger if exists wallet_member_capacity_guard on public.wallet_members;
create trigger wallet_member_capacity_guard
before insert or update on public.wallet_members
for each row
execute function private.enforce_wallet_member_capacity();

create or replace function public.accept_wallet_invitation_atomic(
  invitation_token text,
  accepting_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_row public.wallet_invitations%rowtype;
  existing_member_id uuid;
begin
  select *
  into invitation_row
  from public.wallet_invitations
  where token = invitation_token
  for update;

  if not found then
    raise exception 'Undangan tidak ditemukan.';
  end if;

  perform private.lock_wallet_capacity(invitation_row.wallet_id);

  if invitation_row.status = 'accepted' then
    return invitation_row.wallet_id;
  end if;

  if invitation_row.status = 'revoked' then
    raise exception 'Undangan ini sudah dibatalkan oleh pemilik wallet.';
  end if;

  if invitation_row.expires_at < timezone('utc', now()) then
    update public.wallet_invitations
    set status = 'expired',
        updated_by = accepting_user_id
    where id = invitation_row.id;

    raise exception 'Undangan ini sudah kedaluwarsa.';
  end if;

  select id
  into existing_member_id
  from public.wallet_members
  where wallet_id = invitation_row.wallet_id
    and user_id = accepting_user_id
  limit 1;

  update public.wallet_invitations
  set status = 'accepted',
      accepted_by = accepting_user_id,
      updated_by = accepting_user_id
  where id = invitation_row.id;

  if existing_member_id is null then
    insert into public.wallet_members (
      wallet_id,
      user_id,
      role,
      created_by,
      updated_by
    )
    values (
      invitation_row.wallet_id,
      accepting_user_id,
      invitation_row.role,
      accepting_user_id,
      accepting_user_id
    );
  end if;

  return invitation_row.wallet_id;
end;
$$;

revoke all on function private.wallet_member_limit() from public, anon, authenticated;
revoke all on function private.lock_wallet_capacity(uuid) from public, anon, authenticated;
revoke all on function private.wallet_member_count(uuid) from public, anon, authenticated;
revoke all on function private.wallet_pending_invitation_count(uuid, uuid) from public, anon, authenticated;
revoke all on function private.wallet_occupied_slots(uuid, uuid) from public, anon, authenticated;
revoke all on function private.raise_wallet_member_limit() from public, anon, authenticated;
revoke all on function private.enforce_wallet_invitation_capacity() from public, anon, authenticated;
revoke all on function private.enforce_wallet_member_capacity() from public, anon, authenticated;

revoke all on function public.accept_wallet_invitation_atomic(text, uuid) from public, anon, authenticated;
grant execute on function public.accept_wallet_invitation_atomic(text, uuid) to service_role;
create type public.recurring_frequency as enum ('daily', 'weekly', 'monthly');
create type public.recurring_status as enum ('active', 'paused', 'ended');

create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  kind public.transaction_kind not null,
  amount numeric(14, 2) not null check (amount > 0),
  note text,
  frequency public.recurring_frequency not null,
  interval_count integer not null default 1 check (interval_count > 0),
  start_date date not null,
  end_date date,
  next_run_at timestamptz not null,
  status public.recurring_status not null default 'active',
  last_generated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  check (end_date is null or end_date >= start_date)
);

alter table public.transactions
  add column recurring_transaction_id uuid references public.recurring_transactions(id) on delete set null,
  add column recurring_scheduled_for timestamptz;

create index idx_recurring_transactions_wallet_status_next_run
  on public.recurring_transactions (wallet_id, status, next_run_at);

create index idx_recurring_transactions_status_next_run
  on public.recurring_transactions (status, next_run_at);

create unique index idx_transactions_recurring_unique_schedule
  on public.transactions (recurring_transaction_id, recurring_scheduled_for)
  where recurring_transaction_id is not null;

create trigger set_recurring_transactions_updated_at
before update on public.recurring_transactions
for each row
execute function public.set_updated_at();

alter table public.recurring_transactions enable row level security;

grant select, insert, update, delete on public.recurring_transactions to authenticated;
grant select, insert, update, delete on public.recurring_transactions to service_role;

create policy "recurring_transactions_select_members" on public.recurring_transactions
for select to authenticated
using (private.is_wallet_member(wallet_id));

create policy "recurring_transactions_mutate_editors" on public.recurring_transactions
for all to authenticated
using (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

create or replace function private.normalize_recurring_run(target_date date)
returns timestamptz
language sql
immutable
set search_path = ''
as $$
  select target_date::timestamp at time zone 'UTC';
$$;

create or replace function private.next_recurring_occurrence(
  current_run_at timestamptz,
  anchor_date date,
  recurrence public.recurring_frequency,
  recurrence_interval integer
)
returns timestamptz
language plpgsql
immutable
set search_path = ''
as $$
declare
  current_date_utc date := (current_run_at at time zone 'UTC')::date;
  target_month date;
  last_day date;
  anchor_day integer := extract(day from anchor_date);
  target_day integer;
begin
  if recurrence = 'daily' then
    return current_run_at + make_interval(days => recurrence_interval);
  end if;

  if recurrence = 'weekly' then
    return current_run_at + make_interval(days => recurrence_interval * 7);
  end if;

  target_month := make_date(
    extract(year from (current_date_utc + make_interval(months => recurrence_interval)))::integer,
    extract(month from (current_date_utc + make_interval(months => recurrence_interval)))::integer,
    1
  );
  last_day := (target_month + interval '1 month - 1 day')::date;
  target_day := least(anchor_day, extract(day from last_day)::integer);

  return private.normalize_recurring_run(make_date(extract(year from target_month)::integer, extract(month from target_month)::integer, target_day));
end;
$$;

create or replace function public.process_due_recurring_transactions(
  run_until timestamptz default timezone('utc', now()),
  batch_size integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  recurring_row public.recurring_transactions%rowtype;
  next_run timestamptz;
  processed_count integer := 0;
  generated_count integer := 0;
  skipped_count integer := 0;
begin
  for recurring_row in
    select *
    from public.recurring_transactions
    where status = 'active'
      and next_run_at <= run_until
    order by next_run_at asc
    limit batch_size
    for update skip locked
  loop
    processed_count := processed_count + 1;

    while recurring_row.status = 'active' and recurring_row.next_run_at <= run_until loop
      if recurring_row.end_date is not null and (recurring_row.next_run_at at time zone 'UTC')::date > recurring_row.end_date then
        recurring_row.status := 'ended';
        exit;
      end if;

      begin
        insert into public.transactions (
          wallet_id,
          category_id,
          kind,
          amount,
          happened_at,
          note,
          created_by,
          updated_by,
          recurring_transaction_id,
          recurring_scheduled_for
        )
        values (
          recurring_row.wallet_id,
          recurring_row.category_id,
          recurring_row.kind,
          recurring_row.amount,
          recurring_row.next_run_at,
          recurring_row.note,
          coalesce(recurring_row.updated_by, recurring_row.created_by),
          coalesce(recurring_row.updated_by, recurring_row.created_by),
          recurring_row.id,
          recurring_row.next_run_at
        );

        generated_count := generated_count + 1;
      exception
        when unique_violation then
          skipped_count := skipped_count + 1;
      end;

      recurring_row.last_generated_at := recurring_row.next_run_at;
      next_run := private.next_recurring_occurrence(
        recurring_row.next_run_at,
        recurring_row.start_date,
        recurring_row.frequency,
        recurring_row.interval_count
      );
      recurring_row.next_run_at := next_run;

      if recurring_row.end_date is not null and (next_run at time zone 'UTC')::date > recurring_row.end_date then
        recurring_row.status := 'ended';
      end if;
    end loop;

    update public.recurring_transactions
    set
      next_run_at = recurring_row.next_run_at,
      last_generated_at = recurring_row.last_generated_at,
      status = recurring_row.status
    where id = recurring_row.id;
  end loop;

  return jsonb_build_object(
    'processed', processed_count,
    'generated', generated_count,
    'skipped', skipped_count,
    'run_until', run_until
  );
end;
$$;

revoke all on function private.normalize_recurring_run(date) from public, anon, authenticated;
revoke all on function private.next_recurring_occurrence(timestamptz, date, public.recurring_frequency, integer) from public, anon, authenticated;

revoke all on function public.process_due_recurring_transactions(timestamptz, integer) from public, anon, authenticated;
grant execute on function public.process_due_recurring_transactions(timestamptz, integer) to service_role;
create type public.saving_entry_type as enum ('deposit', 'withdraw');

create table public.savings (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) check (target_amount is null or target_amount >= 0),
  current_balance numeric(14, 2) not null default 0 check (current_balance >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  unique (wallet_id, name)
);

create table public.saving_entries (
  id uuid primary key default gen_random_uuid(),
  saving_id uuid not null references public.savings(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  entry_type public.saving_entry_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  happened_at timestamptz not null default timezone('utc', now()),
  note text,
  member_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id)
);

create index idx_savings_wallet_archived on public.savings (wallet_id, is_archived, name);
create index idx_saving_entries_saving_happened_at on public.saving_entries (saving_id, happened_at desc);
create index idx_saving_entries_wallet_member on public.saving_entries (wallet_id, member_user_id);

create trigger set_savings_updated_at
before update on public.savings
for each row execute function public.set_updated_at();

create trigger set_saving_entries_updated_at
before update on public.saving_entries
for each row execute function public.set_updated_at();

create or replace function private.compute_wallet_available_balance(target_wallet_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  with transaction_balance as (
    select coalesce(
      sum(
        case
          when t.kind = 'income' then t.amount
          else -t.amount
        end
      ),
      0
    ) as amount
    from public.transactions t
    where t.wallet_id = target_wallet_id
  ),
  saving_flow as (
    select coalesce(
      sum(
        case
          when se.entry_type = 'deposit' then se.amount
          else -se.amount
        end
      ),
      0
    ) as amount
    from public.saving_entries se
    where se.wallet_id = target_wallet_id
  )
  select transaction_balance.amount - saving_flow.amount
  from transaction_balance, saving_flow;
$$;

create or replace function private.lock_saving_balance_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.current_balance is distinct from old.current_balance and pg_trigger_depth() = 0 then
    raise exception 'current_balance_managed_by_entries';
  end if;

  return new;
end;
$$;

create or replace function private.validate_and_apply_saving_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  saving_wallet_id uuid;
  saving_current_balance numeric(14, 2);
  wallet_kind public.wallet_kind;
  available_balance numeric(14, 2);
begin
  select s.wallet_id, s.current_balance, w.kind
    into saving_wallet_id, saving_current_balance, wallet_kind
  from public.savings s
  join public.wallets w on w.id = s.wallet_id
  where s.id = new.saving_id
  for update;

  if saving_wallet_id is null then
    raise exception 'saving_not_found';
  end if;

  if new.wallet_id <> saving_wallet_id then
    raise exception 'saving_wallet_mismatch';
  end if;

  if new.entry_type = 'deposit' then
    if wallet_kind = 'shared' and new.member_user_id is null then
      raise exception 'shared_saving_member_required';
    end if;

    if new.member_user_id is not null and not exists (
      select 1
      from public.wallet_members wm
      where wm.wallet_id = new.wallet_id
        and wm.user_id = new.member_user_id
    ) then
      raise exception 'saving_member_not_in_wallet';
    end if;

    available_balance := private.compute_wallet_available_balance(new.wallet_id);

    if new.amount > available_balance then
      raise exception 'insufficient_available_balance';
    end if;

    update public.savings
    set current_balance = current_balance + new.amount,
        updated_by = new.updated_by
    where id = new.saving_id;
  else
    if new.amount > saving_current_balance then
      raise exception 'insufficient_saving_balance';
    end if;

    update public.savings
    set current_balance = current_balance - new.amount,
        updated_by = new.updated_by
    where id = new.saving_id;
  end if;

  return new;
end;
$$;

create trigger lock_saving_balance_change
before update on public.savings
for each row execute function private.lock_saving_balance_change();

create trigger apply_saving_entry
before insert on public.saving_entries
for each row execute function private.validate_and_apply_saving_entry();

alter table public.savings enable row level security;
alter table public.saving_entries enable row level security;

grant select, insert, update, delete on public.savings to authenticated;
grant select, insert, update, delete on public.savings to service_role;
grant select, insert on public.saving_entries to authenticated;
grant select, insert, update, delete on public.saving_entries to service_role;
grant execute on function private.compute_wallet_available_balance(uuid) to authenticated;

create policy "savings_select_members" on public.savings
for select to authenticated
using (private.is_wallet_member(wallet_id));

create policy "savings_mutate_editors" on public.savings
for all to authenticated
using (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

create policy "saving_entries_select_members" on public.saving_entries
for select to authenticated
using (private.is_wallet_member(wallet_id));

create policy "saving_entries_insert_editors" on public.saving_entries
for insert to authenticated
with check (private.has_wallet_role(wallet_id, array['owner', 'editor']::public.wallet_role[]));

revoke all on function private.lock_saving_balance_change() from public, anon, authenticated;
revoke all on function private.validate_and_apply_saving_entry() from public, anon, authenticated;
alter table public.transactions
  add column saving_entry_id uuid references public.saving_entries(id) on delete set null;

create unique index idx_transactions_saving_entry_unique
  on public.transactions (saving_entry_id)
  where saving_entry_id is not null;

create or replace function private.ensure_saving_system_category(
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

  if target_kind = 'expense' then
    category_name := 'Tabungan';
    category_color := '#5d7a74';
  else
    category_name := 'Pencairan Tabungan';
    category_color := '#7a9d8f';
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

create or replace function private.compute_wallet_available_balance(target_wallet_id uuid)
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    sum(
      case
        when t.kind = 'income' then t.amount
        else -t.amount
      end
    ),
    0
  )
  from public.transactions t
  where t.wallet_id = target_wallet_id;
$$;

create or replace function private.create_transaction_from_saving_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := coalesce(new.updated_by, new.created_by, auth.uid());
  category_id uuid;
  transaction_kind public.transaction_kind;
  transaction_note text;
begin
  transaction_kind := case
    when new.entry_type = 'deposit' then 'expense'::public.transaction_kind
    else 'income'::public.transaction_kind
  end;

  category_id := private.ensure_saving_system_category(new.wallet_id, transaction_kind, actor_user_id);
  transaction_note := coalesce(
    new.note,
    case
      when new.entry_type = 'deposit' then 'Setor saving'
      else 'Tarik saving'
    end
  );

  insert into public.transactions (
    wallet_id,
    category_id,
    kind,
    amount,
    happened_at,
    note,
    created_by,
    updated_by,
    saving_entry_id
  )
  values (
    new.wallet_id,
    category_id,
    transaction_kind,
    new.amount,
    new.happened_at,
    transaction_note,
    actor_user_id,
    actor_user_id,
    new.id
  );

  return new;
end;
$$;

create or replace function private.prevent_saving_transaction_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.saving_entry_id is not null and pg_trigger_depth() = 0 then
    raise exception 'saving_transaction_managed_by_entries';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists create_transaction_from_saving_entry on public.saving_entries;
create trigger create_transaction_from_saving_entry
after insert on public.saving_entries
for each row execute function private.create_transaction_from_saving_entry();

drop trigger if exists prevent_saving_transaction_update on public.transactions;
create trigger prevent_saving_transaction_update
before update on public.transactions
for each row execute function private.prevent_saving_transaction_mutation();

drop trigger if exists prevent_saving_transaction_delete on public.transactions;
create trigger prevent_saving_transaction_delete
before delete on public.transactions
for each row execute function private.prevent_saving_transaction_mutation();

insert into public.categories (
  wallet_id,
  name,
  kind,
  color,
  is_system,
  created_by,
  updated_by
)
select
  w.id,
  'Pencairan Tabungan',
  'income'::public.transaction_kind,
  '#7a9d8f',
  true,
  w.owner_user_id,
  w.owner_user_id
from public.wallets w
where not exists (
  select 1
  from public.categories c
  where c.wallet_id = w.id
    and c.name = 'Pencairan Tabungan'
    and c.kind = 'income'
);

with backfill_entries as (
  select
    se.id as saving_entry_id,
    se.wallet_id,
    se.happened_at,
    se.amount,
    coalesce(
      se.note,
      case
        when se.entry_type = 'deposit' then 'Setor saving'
        else 'Tarik saving'
      end
    ) as note,
    coalesce(se.updated_by, se.created_by, w.owner_user_id) as actor_user_id,
    case
      when se.entry_type = 'deposit' then 'expense'::public.transaction_kind
      else 'income'::public.transaction_kind
    end as transaction_kind
  from public.saving_entries se
  join public.wallets w on w.id = se.wallet_id
  left join public.transactions t on t.saving_entry_id = se.id
  where t.id is null
),
resolved_categories as (
  select
    entry.*,
    private.ensure_saving_system_category(entry.wallet_id, entry.transaction_kind, entry.actor_user_id) as category_id
  from backfill_entries entry
)
insert into public.transactions (
  wallet_id,
  category_id,
  kind,
  amount,
  happened_at,
  note,
  created_by,
  updated_by,
  saving_entry_id
)
select
  wallet_id,
  category_id,
  transaction_kind,
  amount,
  happened_at,
  note,
  actor_user_id,
  actor_user_id,
  saving_entry_id
from resolved_categories;

create or replace function public.create_saving_entry_with_transaction(
  target_wallet_id uuid,
  target_saving_id uuid,
  target_entry_type public.saving_entry_type,
  target_amount numeric,
  target_happened_at timestamptz,
  target_note text default null,
  target_member_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
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

  insert into public.saving_entries (
    wallet_id,
    saving_id,
    entry_type,
    amount,
    happened_at,
    note,
    member_user_id,
    created_by,
    updated_by
  )
  values (
    target_wallet_id,
    target_saving_id,
    target_entry_type,
    target_amount,
    target_happened_at,
    target_note,
    case
      when target_entry_type = 'deposit' then target_member_user_id
      else null
    end,
    actor_user_id,
    actor_user_id
  )
  returning id into created_entry_id;

  return created_entry_id;
end;
$$;

revoke all on function private.ensure_saving_system_category(uuid, public.transaction_kind, uuid) from public, anon, authenticated;
revoke all on function private.create_transaction_from_saving_entry() from public, anon, authenticated;
revoke all on function private.prevent_saving_transaction_mutation() from public, anon, authenticated;
revoke all on function public.create_saving_entry_with_transaction(uuid, uuid, public.saving_entry_type, numeric, timestamptz, text, uuid) from public, anon, authenticated;
grant execute on function public.create_saving_entry_with_transaction(uuid, uuid, public.saving_entry_type, numeric, timestamptz, text, uuid) to authenticated;
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
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    'IDR'
  )
  on conflict (id) do update
  set
    full_name = coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      public.profiles.full_name
    ),
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

insert into public.profiles (id, full_name, email, default_currency)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.email,
  'IDR'
from auth.users u
on conflict (id) do update
set
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  email = excluded.email,
  updated_at = timezone('utc', now());
create type public.transaction_source as enum ('manual', 'saving_adjustment', 'balance_adjustment');

alter table public.transactions
  add column source public.transaction_source not null default 'manual';

update public.transactions
set source = case
  when saving_entry_id is not null then 'saving_adjustment'::public.transaction_source
  else 'manual'::public.transaction_source
end
where source = 'manual'::public.transaction_source;

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

create or replace function private.create_transaction_from_saving_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_user_id uuid := coalesce(new.updated_by, new.created_by, auth.uid());
  category_id uuid;
  transaction_kind public.transaction_kind;
  transaction_note text;
begin
  transaction_kind := case
    when new.entry_type = 'deposit' then 'expense'::public.transaction_kind
    else 'income'::public.transaction_kind
  end;

  category_id := private.ensure_saving_system_category(new.wallet_id, transaction_kind, actor_user_id);
  transaction_note := coalesce(
    new.note,
    case
      when new.entry_type = 'deposit' then 'Setor saving'
      else 'Tarik saving'
    end
  );

  insert into public.transactions (
    wallet_id,
    category_id,
    kind,
    amount,
    happened_at,
    note,
    created_by,
    updated_by,
    saving_entry_id,
    source
  )
  values (
    new.wallet_id,
    category_id,
    transaction_kind,
    new.amount,
    new.happened_at,
    transaction_note,
    actor_user_id,
    actor_user_id,
    new.id,
    'saving_adjustment'::public.transaction_source
  );

  return new;
end;
$$;

update public.transactions
set source = 'saving_adjustment'::public.transaction_source
where saving_entry_id is not null;

grant execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid) to authenticated;
grant execute on function public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid) to service_role;
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
create table public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index idx_user_api_keys_user_id on public.user_api_keys (user_id);
create index idx_user_api_keys_key_hash on public.user_api_keys (key_hash);

alter table public.user_api_keys enable row level security;

create policy "user_api_keys_select_own" on public.user_api_keys
  for select to authenticated
  using (user_id = auth.uid());

create policy "user_api_keys_insert_own" on public.user_api_keys
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "user_api_keys_update_own" on public.user_api_keys
  for update to authenticated
  using (user_id = auth.uid());

create policy "user_api_keys_delete_own" on public.user_api_keys
  for delete to authenticated
  using (user_id = auth.uid());

-- Admin key lookup for API gateway verification
create function private.lookup_api_key(lookup_hash text)
returns table (
  id uuid,
  user_id uuid,
  key_hash text,
  revoked_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select k.id, k.user_id, k.key_hash, k.revoked_at
  from public.user_api_keys k
  where k.key_hash = lookup_hash
  limit 1;
$$;

grant execute on function private.lookup_api_key(text) to service_role;

-- Best-effort last_used_at update
create function private.touch_api_key(key_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.user_api_keys
  set last_used_at = now()
  where id = key_id;
$$;

grant execute on function private.touch_api_key(uuid) to service_role;alter table public.profiles
add column onboarding_state text not null default 'active',
add column onboarding_dismissed_at timestamptz,
add column onboarding_completed_at timestamptz;

alter table public.profiles
add constraint profiles_onboarding_state_check
check (onboarding_state in ('active', 'dismissed', 'completed'));

update public.profiles
set onboarding_state = 'completed',
    onboarding_completed_at = coalesce(onboarding_completed_at, timezone('utc', now()))
where onboarding_dismissed_at is null
  and onboarding_completed_at is null;
alter table public.profiles
add column theme_preference text not null default 'system';

alter table public.profiles
add constraint profiles_theme_preference_check
check (theme_preference in ('light', 'dark', 'system'));
alter table public.profiles
add column preferred_locale text not null default 'id';

alter table public.profiles
add constraint profiles_preferred_locale_check
check (preferred_locale in ('id', 'en'));
alter table public.profiles
add column plan_type text not null default 'free',
add column monthly_transaction_count integer not null default 0,
add column monthly_transaction_reset_at timestamptz;

alter table public.profiles
add constraint profiles_plan_type_check
check (plan_type in ('free', 'premium'));
alter table public.profiles
add column timezone text;

comment on column public.profiles.timezone is 'Manual override untuk timezone user (IANA format, e.g. Asia/Jakarta). Null berarti auto-detect dari browser.';
alter table public.wallets add column currency text not null default 'IDR';
create or replace function public.get_wallet_balances(wallet_ids uuid[])
returns table(wallet_id uuid, available_balance numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.wallet_id,
    coalesce(sum(case when t.kind = 'income' then t.amount else -t.amount end), 0) as available_balance
  from public.transactions t
  where t.wallet_id = any(wallet_ids)
  group by t.wallet_id;
$$;
-- Free Trial 7 Hari
--
-- Every new profile gets a 7-day Premium trial automatically.
-- Existing profiles are NOT retroactively granted a trial.

-- 1. Add trial columns to profiles
alter table public.profiles
  add column trial_started_at timestamptz,
  add column trial_ends_at timestamptz,
  add column trial_consumed_at timestamptz;

-- 2. Replace the auth sync trigger function to set trial on INSERT
--    and preserve trial on ON CONFLICT DO UPDATE.
create or replace function private.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, email, default_currency, trial_started_at, trial_ends_at, trial_consumed_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    'IDR',
    timezone('utc', now()),
    timezone('utc', now()) + interval '7 days',
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    full_name = coalesce(new.raw_user_meta_data ->> 'full_name', public.profiles.full_name),
    email = excluded.email,
    updated_at = timezone('utc', now());
  -- NOTE: trial_started_at, trial_ends_at, trial_consumed_at are NOT updated on conflict,
  -- so existing profiles keep their trial (or lack thereof) on subsequent logins.

  return new;
end;
$$;

-- 3. Backfill existing auth users who do not yet have a profile row.
--    Leave trial fields untouched on conflict so we don't retroactively give trials.
insert into public.profiles (id, full_name, email, default_currency, trial_started_at, trial_ends_at, trial_consumed_at)
select
  u.id,
  u.raw_user_meta_data ->> 'full_name',
  u.email,
  'IDR',
  timezone('utc', now()),
  timezone('utc', now()) + interval '7 days',
  timezone('utc', now())
from auth.users u
on conflict (id) do update
set
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  email = excluded.email,
  updated_at = timezone('utc', now());
alter table public.profiles
add column ai_chat_enabled boolean not null default false,
add column ai_chat_consent_version text,
add column ai_chat_consented_at timestamptz;

comment on column public.profiles.ai_chat_enabled is 'User-controlled toggle for AI Chat. Defaults to false until consent is accepted.';
comment on column public.profiles.ai_chat_consent_version is 'Latest accepted compliance disclosure version for AI Chat.';
comment on column public.profiles.ai_chat_consented_at is 'Timestamp when the user accepted the current AI Chat disclosure.';
-- Midtrans Payment Gateway Integration
--
-- Adds subscription tracking tables, payment notification logging,
-- and an expiry processor for the premium plan system.

-- 1. Custom enums
do $$ begin
  create type subscription_status as enum ('pending', 'active', 'expired', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type subscription_period as enum ('monthly', 'annual');
exception
  when duplicate_object then null;
end $$;

-- 2. Subscriptions table
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id text not null unique,                         -- Midtrans order_id
  period subscription_period not null,
  status subscription_status not null default 'pending',
  amount numeric(14,2) not null check (amount > 0),
  payment_channel text,                                   -- e.g. "gopay", "bank_transfer"
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Indexes
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_order_id on public.subscriptions(order_id);
create index idx_subscriptions_status_expires on public.subscriptions(status, expires_at)
  where status in ('active', 'pending');

-- RLS
alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Service role manages all subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

-- 3. Payment notifications table (raw webhook payloads)
create table public.payment_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id text not null,                                  -- references subscriptions.order_id loosely
  transaction_id text,                                     -- Midtrans transaction_id
  payment_status text not null,                            -- e.g. "settlement", "pending", "expire"
  raw_payload jsonb not null,
  signature_verified boolean not null default false,
  processed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- Prevent duplicate processing of the same Midtrans notification
create unique index idx_payment_notifications_dedup
  on public.payment_notifications(order_id, transaction_id, payment_status)
  where processed = false;

-- Index for looking up by order_id
create index idx_payment_notifications_order_id on public.payment_notifications(order_id);

-- RLS
alter table public.payment_notifications enable row level security;

-- Only service_role can read/write payment notifications; users never access them directly
create policy "Service role manages payment notifications"
  on public.payment_notifications for all
  using (auth.role() = 'service_role');

-- 4. Profiles: add subscription_expires_at for quick plan lookup
alter table public.profiles
  add column subscription_expires_at timestamptz;

-- Index for expiry scheduler queries
create index idx_profiles_subscription_expires
  on public.profiles(subscription_expires_at)
  where subscription_expires_at is not null;

-- 5. RPC: process_expired_subscriptions()
--    Called periodically by the recurring scheduler to expire overdue subscriptions.
create or replace function public.process_expired_subscriptions()
returns table (
  processed_user_ids uuid[],
  processed_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_ids uuid[];
begin
  -- Find subscriptions that have expired
  with expired as (
    update public.subscriptions
    set status = 'expired',
        updated_at = timezone('utc', now())
    where status = 'active'
      and expires_at <= timezone('utc', now())
    returning user_id
  )
  select array_agg(e.user_id) into v_user_ids from expired e;

  -- Update profiles: downgrade to free and clear subscription_expires_at
  update public.profiles
  set plan_type = 'free',
      subscription_expires_at = null,
      updated_at = timezone('utc', now())
  where id = any(v_user_ids);

  return query
  select
    coalesce(v_user_ids, '{}'::uuid[]) as processed_user_ids,
    coalesce(array_length(v_user_ids, 1), 0) as processed_count;
end;
$$;

-- 6. Trigger: auto-update updated_at on subscriptions
create or replace function private.update_subscriptions_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function private.update_subscriptions_updated_at();
-- supabase/migrations/0022_fix_wallet_balance_rpc_membership.sql
-- Fix get_wallet_balances to verify wallet membership before returning data.
-- Previously, any authenticated user could query any wallet's balance.

create or replace function public.get_wallet_balances(wallet_ids uuid[])
returns table(wallet_id uuid, available_balance numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.wallet_id,
    coalesce(sum(case when t.kind = 'income' then t.amount else -t.amount end), 0) as available_balance
  from public.transactions t
  where t.wallet_id = any(wallet_ids)
    and private.is_wallet_member(t.wallet_id)
  group by t.wallet_id;
$$;

-- Ensure only authenticated users can execute this (not public/anonymous).
revoke execute on function public.get_wallet_balances(uuid[]) from public, anon;
grant execute on function public.get_wallet_balances(uuid[]) to authenticated;
-- supabase/migrations/0023_cleanup_stale_rpc_functions.sql
-- Drop old 3-parameter ensure_balance_adjustment_category that was
-- deprecated in migration 0011 (execution was revoked, but function
-- body was left in the database).

drop function if exists public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid);
