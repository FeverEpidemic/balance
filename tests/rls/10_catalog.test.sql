-- Structural checks that do not depend on fixtures. They exist because
-- migration 0001 grants full table privileges to `authenticated`, so a table
-- without row level security is readable and writable by every signed-in user.

begin;

do $$
declare
  missing text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into missing
  from pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind = 'r'
    and not c.relrowsecurity;

  assert missing is null, 'tables without row level security: ' || missing;
end;
$$;

do $$
declare
  missing text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into missing
  from pg_class c
  where c.relnamespace = 'public'::regnamespace
    and c.relkind = 'r'
    and not exists (
      select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname
    );

  assert missing is null, 'tables with row level security but no policy: ' || missing;
end;
$$;

-- No policy may be written for the anonymous role: nothing in this schema is
-- meant to be readable without a session.
do $$
declare
  offending text;
begin
  select string_agg(p.tablename || '.' || p.policyname, ', ') into offending
  from pg_policies p
  where p.schemaname = 'public' and 'anon' = any (p.roles);

  assert offending is null, 'policies that target anon: ' || offending;
end;
$$;

rollback;
