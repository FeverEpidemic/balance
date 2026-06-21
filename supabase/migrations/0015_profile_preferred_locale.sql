alter table public.profiles
add column preferred_locale text not null default 'id';

alter table public.profiles
add constraint profiles_preferred_locale_check
check (preferred_locale in ('id', 'en'));
