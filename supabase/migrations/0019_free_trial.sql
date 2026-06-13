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
