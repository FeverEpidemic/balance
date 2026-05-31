create or replace function private.handle_auth_user_sync()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, full_name, email, default_currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    'IDR'
  )
  on conflict (id) do update
  set
    full_name = coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      public.profiles.full_name
    ),
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

insert into public.profiles (id, full_name, email, default_currency)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.email,
  'IDR'
from auth.users u
on conflict (id) do update
set
  full_name = coalesce(excluded.full_name, public.profiles.full_name),
  email = excluded.email,
  updated_at = timezone('utc', now());
