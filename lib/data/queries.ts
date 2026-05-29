import { getMonthDateRange } from "@/lib/finance";
import { createClient } from "@/lib/supabase/server";
import type {
  BudgetRow,
  CategoryRow,
  InvitationRow,
  ProfileRow,
  SettlementRow,
  TemplateRow,
  TransactionRow,
  TransactionSplitRow,
  WalletMemberRow,
  WalletRow
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
  const { data, error } = await supabase.from("wallets").select("id, name, kind, owner_user_id").in("id", walletIds);

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
  const { data, error } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);

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
    .select("id, wallet_id, category_id, kind, amount, happened_at, note, split_type")
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

export async function queryCategories(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, wallet_id, name, kind, color")
    .in("wallet_id", walletIds)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []) as CategoryRow[];
}

export async function queryBudgets(walletIds: string[], month: string) {
  if (walletIds.length === 0) {
    return [];
  }

  const range = getMonthDateRange(month);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .select("id, wallet_id, category_id, month_start, amount")
    .in("wallet_id", walletIds)
    .gte("month_start", range.start)
    .lte("month_start", range.end);

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

export async function queryInvitations(walletIds: string[]) {
  if (walletIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wallet_invitations")
    .select("id, wallet_id, role, token, status, invited_by, expires_at, created_at")
    .in("wallet_id", walletIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as InvitationRow[];
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
