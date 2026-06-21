alter table public.profiles
add column plan_type text not null default 'free',
add column monthly_transaction_count integer not null default 0,
add column monthly_transaction_reset_at timestamptz;

alter table public.profiles
add constraint profiles_plan_type_check
check (plan_type in ('free', 'premium'));
