-- A user who is not a member of a wallet must not be able to read or change
-- anything that belongs to it, in any wallet-scoped table.

begin;

select tests.seed();

create temporary table wallet_scoped_tables (table_name text primary key, wallet_column text not null);
insert into wallet_scoped_tables values
  ('wallets', 'id'),
  ('wallet_members', 'wallet_id'),
  ('wallet_invitations', 'wallet_id'),
  ('categories', 'wallet_id'),
  ('transactions', 'wallet_id'),
  ('transaction_splits', 'wallet_id'),
  ('transaction_templates', 'wallet_id'),
  ('budgets', 'wallet_id'),
  ('recurring_transactions', 'wallet_id'),
  ('savings', 'wallet_id'),
  ('saving_entries', 'wallet_id'),
  ('settlements', 'wallet_id'),
  ('debts', 'wallet_id'),
  ('debt_payments', 'wallet_id');
grant select on wallet_scoped_tables to anon, authenticated;

-- The list above must cover every table that has a wallet_id column, so a new
-- wallet-scoped table cannot be added without being tested here.
do $$
declare
  uncovered text;
begin
  select string_agg(c.table_name, ', ') into uncovered
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.column_name = 'wallet_id'
    and c.table_name not in (select table_name from wallet_scoped_tables);

  assert uncovered is null, 'wallet-scoped tables missing from this test: ' || uncovered;
end;
$$;

-- Sanity check: the fixtures put at least one row per wallet in every table.
do $$
declare
  target record;
  found bigint;
begin
  for target in select * from wallet_scoped_tables loop
    execute format(
      'select count(*) from public.%I where %I = %L',
      target.table_name, target.wallet_column, '10000000-0000-4000-8000-000000000001'
    ) into found;

    assert found > 0, 'fixture has no row in ' || target.table_name;
  end loop;
end;
$$;

-- 1. An outsider sees nothing of the shared wallet and cannot change it.
select tests.act_as('mallory');

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  target record;
  filter text;
begin
  for target in select * from wallet_scoped_tables loop
    filter := format('%I = %L', target.wallet_column, shared_wallet);

    assert tests.visible(format('select 1 from public.%I where %s', target.table_name, filter)) = 0,
      'outsider can read ' || target.table_name;

    -- Try to delete as well. Whether this is refused or silently matches no
    -- rows, step 2 below verifies that every row is still there.
    perform tests.error_of(format('delete from public.%I where %s', target.table_name, filter));
  end loop;
end;
$$;

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  mallory constant uuid := tests.uid('mallory');
begin
  assert tests.error_of(format(
    'insert into public.transactions (wallet_id, kind, amount, created_by) values (%L, ''expense'', 1, %L)',
    shared_wallet, mallory)) = '42501', 'outsider can insert a transaction';

  assert tests.error_of(format(
    'insert into public.categories (wallet_id, name, kind) values (%L, ''Selundupan'', ''expense'')',
    shared_wallet)) = '42501', 'outsider can insert a category';

  assert tests.error_of(format(
    'insert into public.debts (wallet_id, direction, person_name, amount, created_by, updated_by) values (%L, ''lent'', ''x'', 1, %L, %L)',
    shared_wallet, mallory, mallory)) = '42501', 'outsider can insert a debt';

  -- Joining a wallet without an invitation, in any role.
  assert tests.error_of(format(
    'insert into public.wallet_members (wallet_id, user_id, role) values (%L, %L, ''owner'')',
    shared_wallet, mallory)) = '42501', 'outsider can add themselves as owner';

  assert tests.error_of(format(
    'insert into public.wallet_members (wallet_id, user_id, role) values (%L, %L, ''viewer'')',
    shared_wallet, mallory)) = '42501', 'outsider can add themselves as viewer';

  assert tests.error_of(format(
    'insert into public.wallet_invitations (wallet_id, token, invited_by, expires_at) values (%L, ''forged'', %L, now() + interval ''1 day'')',
    shared_wallet, mallory)) = '42501', 'outsider can create an invitation';

  -- Creating a wallet in someone else's name.
  assert tests.error_of(format(
    'insert into public.wallets (name, kind, owner_user_id, created_by) values (''Palsu'', ''personal'', %L, %L)',
    tests.uid('alice'), mallory)) = '42501', 'user can create a wallet owned by someone else';
end;
$$;

-- Updates on rows the outsider cannot see must touch nothing.
do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
begin
  assert tests.affected(format('update public.transactions set amount = 1 where wallet_id = %L', shared_wallet)) = 0,
    'outsider can update transactions';
  assert tests.affected(format('update public.wallets set name = ''dibajak'' where id = %L', shared_wallet)) = 0,
    'outsider can rename the wallet';
  assert tests.affected(format('update public.wallet_members set role = ''viewer'' where wallet_id = %L', shared_wallet)) = 0,
    'outsider can change member roles';
  assert tests.affected(format('update public.budgets set amount = 1 where wallet_id = %L', shared_wallet)) = 0,
    'outsider can update budgets';
end;
$$;

-- 2. Nothing was actually changed or removed.
select tests.act_as_admin();

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  target record;
  found bigint;
begin
  for target in select * from wallet_scoped_tables loop
    execute format(
      'select count(*) from public.%I where %I = %L',
      target.table_name, target.wallet_column, shared_wallet
    ) into found;

    assert found > 0, 'rows disappeared from ' || target.table_name;
  end loop;

  assert (select name from public.wallets where id = shared_wallet) = 'Rumah', 'wallet was renamed';
  assert (select count(*) from public.wallet_members where wallet_id = shared_wallet) = 3, 'membership changed';
end;
$$;

-- 3. Members see their own wallet and nothing of the other one.
do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  other_wallet constant uuid := '10000000-0000-4000-8000-000000000002';
  member text;
  target record;
begin
  foreach member in array array['alice', 'bob', 'carol'] loop
    perform tests.act_as(member);

    for target in select * from wallet_scoped_tables loop
      assert tests.visible(format(
        'select 1 from public.%I where %I = %L', target.table_name, target.wallet_column, other_wallet)) = 0,
        member || ' can read another wallet''s ' || target.table_name;

      -- Invitations are visible to the owner only; everything else to all members.
      if target.table_name <> 'wallet_invitations' or member = 'alice' then
        assert tests.visible(format(
          'select 1 from public.%I where %I = %L', target.table_name, target.wallet_column, shared_wallet)) > 0,
          member || ' cannot read their own wallet''s ' || target.table_name;
      else
        assert tests.visible(format(
          'select 1 from public.%I where %I = %L', target.table_name, target.wallet_column, shared_wallet)) = 0,
          member || ' can read invitations without being the owner';
      end if;
    end loop;

    perform tests.act_as_admin();
  end loop;
end;
$$;

-- 4. Without a session nothing is visible at all.
select tests.act_as_anon();

do $$
declare
  target record;
begin
  for target in select * from wallet_scoped_tables loop
    assert tests.visible(format('select 1 from public.%I', target.table_name)) = 0,
      'anonymous request can read ' || target.table_name;
  end loop;
end;
$$;

rollback;
