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
