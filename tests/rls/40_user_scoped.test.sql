-- Rows that belong to one user: profile, API keys, push subscriptions, and the
-- billing tables that only the server may write.

begin;

select tests.seed();

select tests.act_as('alice');

do $$
declare
  alice constant uuid := tests.uid('alice');
  mallory constant uuid := tests.uid('mallory');
begin
  -- Profiles: own row only, even for members of the same wallet.
  assert (select count(*) from public.profiles) = 1, 'user can read other profiles';
  assert (select id from public.profiles) = alice, 'user reads the wrong profile';
  assert tests.affected(format('update public.profiles set full_name = ''Alice'' where id = %L', alice)) = 1,
    'user cannot update their own profile';
  assert tests.affected(format('update public.profiles set full_name = ''diganti'' where id = %L', mallory)) = 0,
    'user can update another profile';
  assert tests.affected(format('delete from public.profiles where id = %L', mallory)) = 0,
    'user can delete another profile';
  assert tests.error_of(format('insert into public.profiles (id) values (%L)', gen_random_uuid())) = '42501',
    'user can insert a profile';

  -- API keys.
  assert (select count(*) from public.user_api_keys) = 1, 'user can read other API keys';
  assert (select user_id from public.user_api_keys) = alice, 'user reads the wrong API key';
  assert tests.error_of(format(
    'insert into public.user_api_keys (user_id, name, key_hash, key_prefix) values (%L, ''x'', ''forged-hash'', ''bal_forged'')',
    mallory)) = '42501', 'user can create an API key for someone else';
  assert tests.affected(format('update public.user_api_keys set revoked_at = now() where user_id = %L', mallory)) = 0,
    'user can revoke another user''s API key';
  assert tests.affected(format('delete from public.user_api_keys where user_id = %L', mallory)) = 0,
    'user can delete another user''s API key';

  -- Push subscriptions.
  assert (select count(*) from public.push_subscriptions) = 1, 'user can read other push subscriptions';
  assert tests.error_of(format(
    'insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values (%L, ''https://push.example.test/forged'', ''k'', ''a'')',
    mallory)) = '42501', 'user can register a push subscription for someone else';
  assert tests.affected(format('delete from public.push_subscriptions where user_id = %L', mallory)) = 0,
    'user can delete another user''s push subscription';

  -- Subscriptions: readable by their owner, written only by the server.
  assert (select count(*) from public.subscriptions) = 1, 'user can read other subscriptions';
  assert (select user_id from public.subscriptions) = alice, 'user reads the wrong subscription';
  assert tests.error_of(format(
    'insert into public.subscriptions (user_id, order_id, period, amount, status) values (%L, ''BAL-FORGED'', ''annual'', 1, ''active'')',
    alice)) = '42501', 'user can create their own subscription';
  assert tests.affected(format(
    'update public.subscriptions set status = ''active'', expires_at = now() + interval ''10 years'' where user_id = %L',
    alice)) = 0, 'user can activate their own subscription';
  assert tests.affected(format('delete from public.subscriptions where user_id = %L', alice)) = 0,
    'user can delete their own subscription';

  -- Raw payment notifications are server-only.
  assert tests.visible('select 1 from public.payment_notifications') = 0, 'user can read payment notifications';
  assert tests.error_of(
    'insert into public.payment_notifications (order_id, payment_status, raw_payload) values (''BAL-FORGED'', ''settlement'', ''{}'')'
  ) = '42501', 'user can insert a payment notification';
end;
$$;

-- Nothing was changed by the attempts above.
select tests.act_as_admin();

do $$
begin
  assert (select count(*) from public.subscriptions where status = 'pending') = 2, 'subscriptions were modified';
  assert (select count(*) from public.user_api_keys where revoked_at is null) = 2, 'API keys were modified';
  assert (select count(*) from public.push_subscriptions) = 2, 'push subscriptions were modified';
  assert (select count(*) from public.payment_notifications) = 1, 'payment notifications were modified';
end;
$$;

-- Without a session none of it is visible.
select tests.act_as_anon();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'user_api_keys', 'push_subscriptions', 'subscriptions', 'payment_notifications'] loop
    assert tests.visible(format('select 1 from public.%I', table_name)) = 0,
      'anonymous request can read ' || table_name;
  end loop;
end;
$$;

-- The server (secret key) can read and write the billing tables.
select tests.act_as_service();

do $$
begin
  assert (select count(*) from public.subscriptions) = 2, 'service role cannot read subscriptions';
  assert tests.affected(format(
    'update public.subscriptions set status = ''active'' where user_id = %L', tests.uid('alice'))) = 1,
    'service role cannot update subscriptions';
  assert (select count(*) from public.payment_notifications) = 1, 'service role cannot read payment notifications';
end;
$$;

rollback;
