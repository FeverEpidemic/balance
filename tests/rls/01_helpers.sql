-- Test helpers. Everything lives in the `tests` schema, which only exists in
-- the throwaway test database.

create schema if not exists tests;

create table tests.users (
  name text primary key,
  id uuid not null unique
);

-- Switch the current transaction to an API role, the way PostgREST does for a
-- request carrying that user's JWT.
create or replace function tests.act_as(user_name text)
returns void
language plpgsql
as $$
declare
  user_id uuid;
begin
  select u.id into user_id from tests.users u where u.name = user_name;

  if user_id is null then
    raise exception 'unknown test user %', user_name;
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_id, 'role', 'authenticated')::text,
    true
  );
  perform set_config('role', 'authenticated', true);
end;
$$;

-- A request without a session (only the public API key).
create or replace function tests.act_as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end;
$$;

-- A server-side request using the secret key.
create or replace function tests.act_as_service()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  perform set_config('role', 'service_role', true);
end;
$$;

-- Back to the database owner, for inspecting results without RLS.
create or replace function tests.act_as_admin()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('role', 'none', true);
end;
$$;

create or replace function tests.uid(user_name text)
returns uuid
language sql
stable
as $$
  select u.id from tests.users u where u.name = user_name;
$$;

-- Runs a statement as the current role and returns its SQLSTATE if it fails,
-- or null if it succeeds. '42501' is "insufficient privilege", which is what a
-- row level security violation raises.
create or replace function tests.error_of(statement text)
returns text
language plpgsql
as $$
begin
  execute statement;
  return null;
exception
  when others then
    return sqlstate;
end;
$$;

-- Runs a statement as the current role and returns how many rows it touched.
create or replace function tests.affected(statement text)
returns bigint
language plpgsql
as $$
declare
  row_count bigint;
begin
  execute statement;
  get diagnostics row_count = row_count;
  return row_count;
end;
$$;

-- Counts the rows a query returns for the current role. A permission error
-- counts as zero visible rows: either way nothing leaked.
create or replace function tests.visible(query text)
returns bigint
language plpgsql
as $$
declare
  row_count bigint;
begin
  execute format('select count(*) from (%s) q', query) into row_count;
  return row_count;
exception
  when insufficient_privilege then
    return 0;
end;
$$;

grant usage on schema tests to anon, authenticated, service_role;
grant select on tests.users to anon, authenticated, service_role;
grant execute on all functions in schema tests to anon, authenticated, service_role;
