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
