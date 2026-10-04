-- One shared wallet with an owner, an editor and a viewer, plus an unrelated
-- user with a wallet of their own. Each wallet gets one row in every
-- wallet-scoped table so that "sees nothing" is a meaningful result.
--
--   alice    owner  of "Rumah"   (shared)
--   bob      editor of "Rumah"
--   carol    viewer of "Rumah"
--   mallory  owner  of "Pribadi" (personal), not a member of "Rumah"

create or replace function tests.seed()
returns void
language plpgsql
as $$
declare
  alice uuid := '00000000-0000-4000-8000-00000000000a';
  bob uuid := '00000000-0000-4000-8000-00000000000b';
  carol uuid := '00000000-0000-4000-8000-00000000000c';
  mallory uuid := '00000000-0000-4000-8000-00000000000d';
  shared_wallet uuid := '10000000-0000-4000-8000-000000000001';
  other_wallet uuid := '10000000-0000-4000-8000-000000000002';
  target record;
  category_id uuid;
  income_category_id uuid;
  transaction_id uuid;
  saving_id uuid;
  debt_id uuid;
begin
  insert into tests.users (name, id) values
    ('alice', alice), ('bob', bob), ('carol', carol), ('mallory', mallory);

  -- Creating the auth user also creates the profile through the sync trigger.
  insert into auth.users (id, email) values
    (alice, 'alice@example.test'),
    (bob, 'bob@example.test'),
    (carol, 'carol@example.test'),
    (mallory, 'mallory@example.test');

  insert into public.wallets (id, name, kind, owner_user_id, created_by) values
    (shared_wallet, 'Rumah', 'shared', alice, alice),
    (other_wallet, 'Pribadi', 'personal', mallory, mallory);

  insert into public.wallet_members (wallet_id, user_id, role) values
    (shared_wallet, alice, 'owner'),
    (shared_wallet, bob, 'editor'),
    (shared_wallet, carol, 'viewer'),
    (other_wallet, mallory, 'owner');

  for target in
    select * from (values (shared_wallet, alice, bob), (other_wallet, mallory, mallory)) as t(wallet_id, owner_id, other_id)
  loop
    insert into public.categories (wallet_id, name, kind)
    values (target.wallet_id, 'Makan', 'expense')
    returning id into category_id;

    insert into public.categories (wallet_id, name, kind)
    values (target.wallet_id, 'Gaji', 'income')
    returning id into income_category_id;

    insert into public.transactions (wallet_id, category_id, kind, amount, note, created_by)
    values (target.wallet_id, income_category_id, 'income', 1000000, 'gaji', target.owner_id);

    insert into public.transactions (wallet_id, category_id, kind, amount, note, created_by)
    values (target.wallet_id, category_id, 'expense', 25000, 'makan siang', target.owner_id)
    returning id into transaction_id;

    insert into public.transaction_splits (transaction_id, wallet_id, member_user_id, owed_amount)
    values (transaction_id, target.wallet_id, target.other_id, 12500);

    insert into public.budgets (wallet_id, category_id, month_start, amount)
    values (target.wallet_id, category_id, date '2026-06-01', 500000);

    insert into public.transaction_templates (wallet_id, name, kind)
    values (target.wallet_id, 'Kopi', 'expense');

    insert into public.recurring_transactions (wallet_id, kind, amount, frequency, start_date, next_run_at)
    values (target.wallet_id, 'expense', 50000, 'monthly', date '2026-06-01', timestamptz '2026-07-01 00:00:00+00');

    insert into public.savings (wallet_id, name)
    values (target.wallet_id, 'Dana darurat')
    returning id into saving_id;

    insert into public.saving_entries (saving_id, wallet_id, entry_type, amount, member_user_id, created_by)
    values (saving_id, target.wallet_id, 'deposit', 100000, target.owner_id, target.owner_id);

    insert into public.settlements (wallet_id, payer_user_id, payee_user_id, amount)
    values (target.wallet_id, target.other_id, target.owner_id, 12500);

    insert into public.debts (wallet_id, direction, person_name, amount, created_by, updated_by)
    values (target.wallet_id, 'lent', 'Tetangga', 200000, target.owner_id, target.owner_id)
    returning id into debt_id;

    insert into public.debt_payments (debt_id, wallet_id, amount, created_by)
    values (debt_id, target.wallet_id, 50000, target.owner_id);

    insert into public.wallet_invitations (wallet_id, token, invited_by, expires_at)
    values (target.wallet_id, 'token-' || target.wallet_id, target.owner_id, now() + interval '7 days');

    insert into public.user_api_keys (user_id, name, key_hash, key_prefix)
    values (target.owner_id, 'cli', 'hash-' || target.owner_id, 'bal_' || left(target.owner_id::text, 8));

    insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
    values (target.owner_id, 'https://push.example.test/' || target.owner_id, 'p256dh', 'auth');

    insert into public.subscriptions (user_id, order_id, period, amount)
    values (target.owner_id, 'BAL-' || target.owner_id, 'monthly', 29000);
  end loop;

  insert into public.payment_notifications (order_id, payment_status, raw_payload)
  values ('BAL-' || alice, 'pending', '{}'::jsonb);
end;
$$;
