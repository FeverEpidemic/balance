create or replace function public.get_wallet_balances(wallet_ids uuid[])
returns table(wallet_id uuid, available_balance numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.wallet_id,
    coalesce(sum(case when t.kind = 'income' then t.amount else -t.amount end), 0) as available_balance
  from public.transactions t
  where t.wallet_id = any(wallet_ids)
  group by t.wallet_id;
$$;
