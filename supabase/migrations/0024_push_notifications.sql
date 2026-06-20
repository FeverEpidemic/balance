-- supabase/migrations/0024_push_notifications.sql
-- Add daily reminder columns to profiles and create push_subscriptions table for PWA web push notifications.

-- 1. Alter profiles table
alter table public.profiles
  add column daily_reminder_enabled boolean not null default false,
  add column daily_reminder_time time without time zone not null default '20:00:00',
  add column daily_reminder_last_sent_date date default null;

comment on column public.profiles.daily_reminder_enabled is 'Flag whether the daily logging reminder is enabled.';
comment on column public.profiles.daily_reminder_time is 'Time of day (local user timezone) to trigger the reminder.';
comment on column public.profiles.daily_reminder_last_sent_date is 'The last date (local user timezone) on which the daily reminder was successfully sent.';

-- 2. Create push_subscriptions table
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.push_subscriptions is 'Web Push subscriptions for PWA push notifications.';

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies for push_subscriptions
create policy "Users can view their own push subscriptions"
  on public.push_subscriptions for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own push subscriptions"
  on public.push_subscriptions for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete their own push subscriptions"
  on public.push_subscriptions for delete
  to authenticated
  using (user_id = auth.uid());

-- 3. Stored Procedure to fetch due reminders
create or replace function public.get_due_push_reminders()
returns table(
  user_id uuid,
  email text,
  timezone text,
  endpoint text,
  p256dh text,
  auth text,
  local_date date
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    p.id as user_id,
    p.email,
    coalesce(p.timezone, 'Asia/Jakarta') as timezone,
    ps.endpoint,
    ps.p256dh,
    ps.auth,
    (now() at time zone coalesce(p.timezone, 'Asia/Jakarta'))::date as local_date
  from public.profiles p
  join public.push_subscriptions ps on ps.user_id = p.id
  where p.daily_reminder_enabled = true
    and (p.daily_reminder_last_sent_date is null or p.daily_reminder_last_sent_date < (now() at time zone coalesce(p.timezone, 'Asia/Jakarta'))::date)
    and (now() at time zone coalesce(p.timezone, 'Asia/Jakarta'))::time >= p.daily_reminder_time;
end;
$$;

revoke execute on function public.get_due_push_reminders() from public, anon;

-- 4. Stored Procedure to mark reminders as sent
create or replace function public.mark_reminders_sent(user_ids uuid[], local_dates date[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if user_ids is null or array_length(user_ids, 1) is null then
    return;
  end if;
  
  update public.profiles p
  set daily_reminder_last_sent_date = t.local_date
  from (
    select unnest(user_ids) as u_id, unnest(local_dates) as local_date
  ) t
  where p.id = t.u_id;
end;
$$;

revoke execute on function public.mark_reminders_sent(uuid[], date[]) from public, anon;

-- 5. Stored Procedure to delete stale/expired subscription
create or replace function public.delete_push_subscription_by_endpoint(endpoint_url text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_subscriptions
  where endpoint = endpoint_url;
$$;

revoke execute on function public.delete_push_subscription_by_endpoint(text) from public, anon;
