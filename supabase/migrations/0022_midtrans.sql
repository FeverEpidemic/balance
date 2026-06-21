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
