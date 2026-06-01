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
