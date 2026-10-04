-- Inside a wallet: viewers read, editors write data, only the owner manages
-- the wallet itself, its members and its invitations.

begin;

select tests.seed();

-- 1. Viewer: read-only.
select tests.act_as('carol');

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  carol constant uuid := tests.uid('carol');
begin
  assert tests.error_of(format(
    'insert into public.transactions (wallet_id, kind, amount, created_by) values (%L, ''expense'', 1, %L)',
    shared_wallet, carol)) = '42501', 'viewer can insert a transaction';
  assert tests.error_of(format(
    'insert into public.categories (wallet_id, name, kind) values (%L, ''Baru'', ''expense'')',
    shared_wallet)) = '42501', 'viewer can insert a category';
  assert tests.error_of(format(
    'insert into public.budgets (wallet_id, category_id, month_start, amount) select %L, id, date ''2026-07-01'', 1 from public.categories where wallet_id = %L limit 1',
    shared_wallet, shared_wallet)) = '42501', 'viewer can insert a budget';
  assert tests.error_of(format(
    'insert into public.debts (wallet_id, direction, person_name, amount, created_by, updated_by) values (%L, ''lent'', ''x'', 1, %L, %L)',
    shared_wallet, carol, carol)) = '42501', 'viewer can insert a debt';
  assert tests.error_of(format(
    'insert into public.savings (wallet_id, name) values (%L, ''Liburan'')',
    shared_wallet)) = '42501', 'viewer can insert a saving goal';

  assert tests.affected(format('update public.transactions set amount = 1 where wallet_id = %L', shared_wallet)) = 0,
    'viewer can update transactions';
  assert tests.affected(format('delete from public.transactions where wallet_id = %L and source = ''manual''', shared_wallet)) = 0,
    'viewer can delete transactions';
  assert tests.affected(format('update public.budgets set amount = 1 where wallet_id = %L', shared_wallet)) = 0,
    'viewer can update budgets';
  assert tests.affected(format('update public.debts set amount = 1 where wallet_id = %L', shared_wallet)) = 0,
    'viewer can update debts';
  assert tests.affected(format('delete from public.categories where wallet_id = %L', shared_wallet)) = 0,
    'viewer can delete categories';
end;
$$;

-- 2. Editor: can write wallet data, cannot manage the wallet.
select tests.act_as('bob');

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  bob constant uuid := tests.uid('bob');
begin
  assert tests.error_of(format(
    'insert into public.transactions (wallet_id, kind, amount, note, created_by) values (%L, ''expense'', 15000, ''parkir'', %L)',
    shared_wallet, bob)) is null, 'editor cannot insert a transaction';
  assert tests.affected(format(
    'update public.transactions set amount = 16000 where wallet_id = %L and note = ''parkir''', shared_wallet)) = 1,
    'editor cannot update a transaction';
  assert tests.affected(format(
    'delete from public.transactions where wallet_id = %L and note = ''parkir''', shared_wallet)) = 1,
    'editor cannot delete a transaction';
  assert tests.error_of(format(
    'insert into public.categories (wallet_id, name, kind) values (%L, ''Transport'', ''expense'')',
    shared_wallet)) is null, 'editor cannot insert a category';

  -- An editor must not be able to move a row into a wallet they cannot edit.
  assert tests.error_of(format(
    'update public.transactions set wallet_id = %L where wallet_id = %L',
    '10000000-0000-4000-8000-000000000002', shared_wallet)) = '42501',
    'editor can move transactions into another wallet';

  assert tests.affected(format('update public.wallets set name = ''Punya Bob'' where id = %L', shared_wallet)) = 0,
    'editor can rename the wallet';
  assert tests.affected(format(
    'update public.wallet_members set role = ''owner'' where wallet_id = %L and user_id = %L', shared_wallet, bob)) = 0,
    'editor can promote themselves to owner';
  assert tests.affected(format(
    'update public.wallet_members set role = ''viewer'' where wallet_id = %L and user_id = %L',
    shared_wallet, tests.uid('alice'))) = 0, 'editor can demote the owner';
  assert tests.error_of(format(
    'insert into public.wallet_invitations (wallet_id, token, invited_by, expires_at) values (%L, ''dari-editor'', %L, now() + interval ''1 day'')',
    shared_wallet, bob)) = '42501', 'editor can create an invitation';
  assert tests.error_of(format(
    'insert into public.wallet_members (wallet_id, user_id, role) values (%L, %L, ''editor'')',
    shared_wallet, tests.uid('mallory'))) = '42501', 'editor can add a member directly';
end;
$$;

-- 3. Owner: can manage the wallet.
select tests.act_as('alice');

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  alice constant uuid := tests.uid('alice');
begin
  -- Even the owner cannot add a member directly; joining goes through an
  -- invitation. Checked first, while the wallet still has free member slots,
  -- so the refusal comes from the policy and not from the capacity guard.
  assert tests.error_of(format(
    'insert into public.wallet_members (wallet_id, user_id, role) values (%L, %L, ''editor'')',
    shared_wallet, tests.uid('mallory'))) = '42501', 'owner can add a member without an invitation';

  assert tests.affected(format('update public.wallets set name = ''Rumah Kita'' where id = %L', shared_wallet)) = 1,
    'owner cannot rename the wallet';
  assert tests.affected(format(
    'update public.wallet_members set role = ''editor'' where wallet_id = %L and user_id = %L',
    shared_wallet, tests.uid('carol'))) = 1, 'owner cannot change a member role';
  assert tests.error_of(format(
    'insert into public.wallet_invitations (wallet_id, token, invited_by, expires_at) values (%L, ''dari-owner'', %L, now() + interval ''1 day'')',
    shared_wallet, alice)) is null, 'owner cannot create an invitation';
end;
$$;

rollback;
