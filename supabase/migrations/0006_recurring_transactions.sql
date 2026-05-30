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
