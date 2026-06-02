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
