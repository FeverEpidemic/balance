-- supabase/migrations/0023_cleanup_stale_rpc_functions.sql
-- Drop old 3-parameter ensure_balance_adjustment_category that was
-- deprecated in migration 0011 (execution was revoked, but function
-- body was left in the database).

drop function if exists public.ensure_balance_adjustment_category(uuid, public.transaction_kind, uuid);
