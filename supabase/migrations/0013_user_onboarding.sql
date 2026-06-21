alter table public.profiles
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
