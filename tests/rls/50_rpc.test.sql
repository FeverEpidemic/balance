-- SECURITY DEFINER functions bypass row level security, so each one has to
-- enforce access itself.

begin;

select tests.seed();

-- get_wallet_balances only returns wallets the caller belongs to.
select tests.act_as('mallory');

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  other_wallet constant uuid := '10000000-0000-4000-8000-000000000002';
  returned uuid[];
begin
  select array_agg(b.wallet_id) into returned
  from public.get_wallet_balances(array[shared_wallet, other_wallet]) b;

  assert returned = array[other_wallet], 'outsider gets the balance of a wallet they do not belong to';
end;
$$;

select tests.act_as('carol');

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  other_wallet constant uuid := '10000000-0000-4000-8000-000000000002';
  returned uuid[];
  balance numeric;
begin
  select array_agg(b.wallet_id), max(b.available_balance) into returned, balance
  from public.get_wallet_balances(array[shared_wallet, other_wallet]) b;

  assert returned = array[shared_wallet], 'member does not get exactly their own wallet balance';
  -- 1,000,000 income - 25,000 expense - 100,000 moved to savings
  assert balance = 875000, 'unexpected balance: ' || balance;
end;
$$;

-- Saving entries: viewers and outsiders are refused.
do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  saving uuid;
begin
  select id into saving from public.savings where wallet_id = shared_wallet;

  assert tests.error_of(format(
    'select public.create_saving_entry_with_transaction(%L, %L, ''deposit'', 1000, now(), null, %L)',
    shared_wallet, saving, tests.uid('carol'))) is not null, 'viewer can create a saving entry';
end;
$$;

select tests.act_as('mallory');

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
begin
  assert tests.error_of(format(
    'select public.create_saving_entry_with_transaction(%L, %L, ''deposit'', 1000, now(), null, %L)',
    shared_wallet, gen_random_uuid(), tests.uid('mallory'))) is not null,
    'outsider can create a saving entry';

  assert tests.error_of(format(
    'select public.ensure_balance_adjustment_category(%L, ''expense'')', shared_wallet)) is not null,
    'outsider can create a balance adjustment category';

  -- Scheduler entry points are not callable with a user session.
  assert tests.error_of('select public.process_due_recurring_transactions(now(), 10)') = '42501',
    'user can run the recurring transaction scheduler';
  assert tests.error_of(format(
    'select public.accept_wallet_invitation_atomic(%L, %L)',
    'token-10000000-0000-4000-8000-000000000001', tests.uid('mallory'))) = '42501',
    'user can accept an invitation by calling the database function directly';
end;
$$;

-- An editor can use the saving entry function.
select tests.act_as('bob');

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
  saving uuid;
begin
  select id into saving from public.savings where wallet_id = shared_wallet;

  assert tests.error_of(format(
    'select public.create_saving_entry_with_transaction(%L, %L, ''deposit'', 1000, now(), null, %L)',
    shared_wallet, saving, tests.uid('bob'))) is null, 'editor cannot create a saving entry';
end;
$$;

-- Without a session the functions refuse as well.
select tests.act_as_anon();

do $$
declare
  shared_wallet constant uuid := '10000000-0000-4000-8000-000000000001';
begin
  assert tests.error_of(format(
    'select public.ensure_balance_adjustment_category(%L, ''expense'')', shared_wallet)) is not null,
    'anonymous request can create a balance adjustment category';
  assert tests.error_of(format(
    'select * from public.get_wallet_balances(array[%L]::uuid[])', shared_wallet)) = '42501',
    'anonymous request can call get_wallet_balances';
end;
$$;

rollback;
