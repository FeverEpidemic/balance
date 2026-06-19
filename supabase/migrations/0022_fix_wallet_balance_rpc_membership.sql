-- supabase/migrations/0022_fix_wallet_balance_rpc_membership.sql
-- Fix get_wallet_balances to verify wallet membership before returning data.
-- Previously, any authenticated user could query any wallet's balance.

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
    and private.is_wallet_member(t.wallet_id)
  group by t.wallet_id;
$$;

-- Ensure only authenticated users can execute this (not public/anonymous).
revoke execute on function public.get_wallet_balances(uuid[]) from public, anon;
grant execute on function public.get_wallet_balances(uuid[]) to authenticated;
