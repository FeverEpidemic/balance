import { getMonthDateRange } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";
import type {
  BudgetRow,
  CategoryRow,
  InvitationRow,
  InvitationRowSafe,
  ProfileRow,
  RecurringTransactionRow,
  SettlementRow,
  SavingEntryRow,
  SavingRow,
  TemplateRow,
  TransactionRow,
  TransactionHistorySortField,
  TransactionSplitRow,
  UserApiKeyRow,
  WalletMemberRow,
  WalletRow,
  SortDirection
} from "@/lib/data/types";

export async function queryCurrentUserWalletIds(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallet_members")
    .select("wallet_id, user_id, role")
    .eq("user_id", userId)
    .order("wallet_id");

  if (error) {
    throw error;
  }

  return (data ?? []) as WalletMemberRow[];
}

export async function queryWallets(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("wallets").select("id, name, kind, owner_user_id, currency").in("id", walletIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as WalletRow[];
}

export async function queryWalletMembers(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("wallet_members").select("wallet_id, user_id, role").in("wallet_id", walletIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as WalletMemberRow[];
}

export async function queryProfiles(userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, preferred_locale, theme_preference, onboarding_state, onboarding_dismissed_at, onboarding_completed_at, timezone, default_currency, ai_chat_enabled, ai_chat_consent_version, ai_chat_consented_at, plan_type, trial_started_at, trial_ends_at, trial_consumed_at, daily_reminder_enabled, daily_reminder_time")
    .in("id", userIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as ProfileRow[];
}

export async function queryTransactions(walletIds: string[], limit?: number) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  let query = supabase
    .from("transactions")
    .select("id, wallet_id, category_id, kind, amount, happened_at, note, split_type, recurring_transaction_id, recurring_scheduled_for, saving_entry_id, source")
    .in("wallet_id", walletIds)
    .order("happened_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as TransactionRow[];
}

export async function queryTransactionsByMonth(
  walletIds: string[],
  options: {
    month: string;
    limit?: number;
    search?: string;
    sortBy?: TransactionHistorySortField;
    sortDirection?: SortDirection;
  },
) {
  if (walletIds.length === 0) {
    return [];
  }

  const { month, limit, search, sortBy = "happened_at", sortDirection = "desc" } = options;
  const range = getMonthDateRange(month);
  const startAt = `${range.start}T00:00:00.000Z`;
  const endAt = `${range.end}T23:59:59.999Z`;
  const supabase = await createClient();
  const ascending = sortDirection === "asc";
  let query = supabase
    .from("transactions")
    .select("id, wallet_id, category_id, kind, amount, happened_at, note, split_type, recurring_transaction_id, recurring_scheduled_for, saving_entry_id, source")
    .in("wallet_id", walletIds)
    .gte("happened_at", startAt)
    .lte("happened_at", endAt)
    .order(sortBy === "amount" || sortBy === "kind" ? sortBy : "happened_at", { ascending })
    .order("id", { ascending: true });

  if (limit) {
    query = query.limit(limit);
  }

  const normalizedSearch = search?.trim();

  if (normalizedSearch) {
    query = query.or(`note.ilike.%${normalizedSearch}%,kind.ilike.%${normalizedSearch}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as TransactionRow[];
}

export async function queryRecurringTransactions(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select("id, wallet_id, category_id, kind, amount, note, frequency, interval_count, start_date, end_date, next_run_at, status, last_generated_at")
    .in("wallet_id", walletIds)
    .order("next_run_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as RecurringTransactionRow[];
}

export async function querySavings(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings")
    .select("id, wallet_id, name, target_amount, current_balance, is_archived")
    .in("wallet_id", walletIds)
    .order("is_archived", { ascending: true })
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) as SavingRow[];
}

export async function querySavingEntries(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saving_entries")
    .select("id, saving_id, wallet_id, entry_type, amount, happened_at, note, member_user_id")
    .in("wallet_id", walletIds)
    .order("happened_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SavingEntryRow[];
}

export async function queryCategories(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, wallet_id, name, kind, color, is_system")
    .in("wallet_id", walletIds)
    .order("name");

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as CategoryRow[];
  const seen = new Set<string>();
  return rows.filter((row) => {
    const dup = seen.has(row.id);
    seen.add(row.id);
    return !dup;
  });
}

export async function queryBudgets(walletIds: string[], month: string) {
  if (walletIds.length === 0) {
    return [];
  }

  const range = getMonthDateRange(month);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("id, wallet_id, category_id, month_start, amount, carry_over_enabled")
    .in("wallet_id", walletIds)
    .gte("month_start", range.start)
    .lte("month_start", range.end);

  if (error) {
    throw error;
  }

  return (data ?? []) as BudgetRow[];
}

export async function queryAllBudgets(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("id, wallet_id, category_id, month_start, amount, carry_over_enabled")
    .in("wallet_id", walletIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as BudgetRow[];
}

export async function queryTransactionSplits(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("transaction_splits").select("wallet_id, owed_amount, paid_amount").in("wallet_id", walletIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as TransactionSplitRow[];
}

export async function queryTemplates(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_templates")
    .select("id, wallet_id, category_id, kind, name, default_amount, note")
    .in("wallet_id", walletIds)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) as TemplateRow[];
}

export async function queryWalletBalances(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_wallet_balances", { wallet_ids: walletIds });

  if (error) {
    throw error;
  }

  return (data ?? []) as { wallet_id: string; available_balance: number }[];
}

export async function queryHasManualTransaction(walletIds: string[]) {
  if (walletIds.length === 0) {
    return false;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id")
    .in("wallet_id", walletIds)
    .eq("source", "manual")
    .limit(1);

  if (error) {
    throw error;
  }

  return (data?.length ?? 0) > 0;
}

export async function queryInvitations(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallet_invitations")
    .select("id, wallet_id, role, status, invited_by, expires_at, created_at")
    .in("wallet_id", walletIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as InvitationRowSafe[];
}

/** Fetch invitation tokens via admin client (bypasses RLS) for owner-gated use. */
export async function queryInvitationTokens(walletId: string): Promise<Map<string, string>> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  if (!admin) {
    return new Map();
  }

  const { data } = await admin
    .from("wallet_invitations")
    .select("id, token")
    .eq("wallet_id", walletId);

  const map = new Map<string, string>();
  (data ?? []).forEach((row) => {
    map.set(row.id, row.token);
  });
  return map;
}

export async function queryUserApiKeys(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_api_keys")
    .select("id, user_id, name, key_hash, key_prefix, created_at, last_used_at, revoked_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as UserApiKeyRow[];
}

export async function querySettlements(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settlements")
    .select("id, wallet_id, payer_user_id, payee_user_id, amount, happened_at, note")
    .in("wallet_id", walletIds)
    .order("happened_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as SettlementRow[];
}
