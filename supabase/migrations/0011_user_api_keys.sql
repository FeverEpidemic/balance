create table public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  key_hash text not null,
  key_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index idx_user_api_keys_user_id on public.user_api_keys (user_id);
create index idx_user_api_keys_key_hash on public.user_api_keys (key_hash);

alter table public.user_api_keys enable row level security;

create policy "user_api_keys_select_own" on public.user_api_keys
  for select to authenticated
  using (user_id = auth.uid());

create policy "user_api_keys_insert_own" on public.user_api_keys
  for insert to authenticated
  with check (user_id = auth.uid());

create policy "user_api_keys_update_own" on public.user_api_keys
  for update to authenticated
  using (user_id = auth.uid());

create policy "user_api_keys_delete_own" on public.user_api_keys
  for delete to authenticated
  using (user_id = auth.uid());

-- Admin key lookup for API gateway verification
create function private.lookup_api_key(lookup_hash text)
returns table (
  id uuid,
  user_id uuid,
  key_hash text,
  revoked_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select k.id, k.user_id, k.key_hash, k.revoked_at
  from public.user_api_keys k
  where k.key_hash = lookup_hash
  limit 1;
$$;

grant execute on function private.lookup_api_key(text) to service_role;

-- Best-effort last_used_at update
create function private.touch_api_key(key_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.user_api_keys
  set last_used_at = now()
  where id = key_id;
$$;

grant execute on function private.touch_api_key(uuid) to service_role;