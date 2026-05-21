import { cache } from "react";
import { getCurrentMonthKey, getMonthDateRange } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

type WalletRole = "owner" | "editor" | "viewer";
type WalletKind = "personal" | "shared";
type TransactionKind = "income" | "expense";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type WalletRow = {
  id: string;
  name: string;
  kind: WalletKind;
  owner_user_id: string;
};

type WalletMemberRow = {
  wallet_id: string;
  user_id: string;
  role: WalletRole;
};

type CategoryRow = {
  id: string;
  wallet_id: string;
  name: string;
  kind: TransactionKind;
  color: string;
};

type BudgetRow = {
  id: string;
  wallet_id: string;
  category_id: string;
  month_start: string;
  amount: number;
};

type TransactionRow = {
  id: string;
  wallet_id: string;
  category_id: string | null;
  kind: TransactionKind;
  amount: number;
  happened_at: string;
  note: string | null;
  split_type: "equal" | "custom" | null;
};

type TransactionSplitRow = {
  wallet_id: string;
  owed_amount: number;
  paid_amount: number;
};

type TemplateRow = {
  id: string;
  wallet_id: string;
  category_id: string | null;
  kind: TransactionKind;
  name: string;
  default_amount: number | null;
  note: string | null;
};

type SettlementRow = {
  id: string;
  wallet_id: string;
  payer_user_id: string;
  payee_user_id: string;
  amount: number;
  happened_at: string;
  note: string | null;
};

export type ShellData = {
  userName: string;
  walletCount: number;
  budgetCount: number;
  memberCount: number;
  primaryWalletId: string | null;
};

export type WalletSummary = {
  id: string;
  name: string;
  kind: WalletKind;
  role: WalletRole;
  members: number;
  balance: number;
  spentThisMonth: number;
  budgetThisMonth: number;
};

export type DashboardData = {
  shell: ShellData;
  totalBalance: number;
  totalExpenseThisMonth: number;
  outstandingSplit: number;
  wallets: WalletSummary[];
  recentTransactions: Array<{
    id: string;
    walletId: string;
    walletName: string;
    category: string;
    title: string;
    kind: TransactionKind;
    amount: number;
    date: string;
    splitLabel: string;
  }>;
  categorySpend: Array<{
    name: string;
    value: number;
    color: string;
  }>;
};

export type WalletBundle = {
  shell: ShellData;
  profileMap: Map<string, ProfileRow>;
  categories: CategoryRow[];
  budgets: BudgetRow[];
  members: WalletMemberRow[];
  settlements: SettlementRow[];
  templates: TemplateRow[];
  transactions: TransactionRow[];
  wallet: WalletSummary;
};

async function queryCurrentUserWalletIds(userId: string) {
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

async function queryWallets(walletIds: string[]) {
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

async function queryWalletMembers(walletIds: string[]) {
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

async function queryProfiles(userIds: string[]) {
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

async function queryTransactions(walletIds: string[], limit?: number) {
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

async function queryCategories(walletIds: string[]) {
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

async function queryBudgets(walletIds: string[], month: string) {
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

async function queryTransactionSplits(walletIds: string[]) {
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

async function queryTemplates(walletIds: string[]) {
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

async function querySettlements(walletIds: string[]) {
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

function sumBalance(transactions: TransactionRow[]) {
  return transactions.reduce((total, transaction) => {
    return total + (transaction.kind === "income" ? transaction.amount : -transaction.amount);
  }, 0);
}

function buildWalletSummaries(args: {
  memberships: WalletMemberRow[];
  wallets: WalletRow[];
  memberRows: WalletMemberRow[];
  transactions: TransactionRow[];
  budgets: BudgetRow[];
  month: string;
}) {
  const { memberships, wallets, memberRows, transactions, budgets, month } = args;
  const currentRange = getMonthDateRange(month);
  const roleByWallet = new Map(memberships.map((membership) => [membership.wallet_id, membership.role]));
  const memberCountByWallet = new Map<string, number>();
  const transactionByWallet = new Map<string, TransactionRow[]>();
  const budgetByWallet = new Map<string, BudgetRow[]>();

  memberRows.forEach((row) => {
    memberCountByWallet.set(row.wallet_id, (memberCountByWallet.get(row.wallet_id) ?? 0) + 1);
  });

  transactions.forEach((row) => {
    const current = transactionByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    transactionByWallet.set(row.wallet_id, current);
  });

  budgets.forEach((row) => {
    const current = budgetByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    budgetByWallet.set(row.wallet_id, current);
  });

  return wallets
    .map((wallet) => {
      const walletTransactions = transactionByWallet.get(wallet.id) ?? [];
      const monthExpenses = walletTransactions
        .filter((row) => row.kind === "expense" && row.happened_at.slice(0, 10) >= currentRange.start && row.happened_at.slice(0, 10) <= currentRange.end)
        .reduce((total, row) => total + row.amount, 0);
      const monthBudget = (budgetByWallet.get(wallet.id) ?? []).reduce((total, row) => total + row.amount, 0);

      return {
        id: wallet.id,
        name: wallet.name,
        kind: wallet.kind,
        role: roleByWallet.get(wallet.id) ?? "viewer",
        members: memberCountByWallet.get(wallet.id) ?? 0,
        balance: sumBalance(walletTransactions),
        spentThisMonth: monthExpenses,
        budgetThisMonth: monthBudget
      } satisfies WalletSummary;
    })
    .sort((left, right) => left.name.localeCompare(right.name, "id-ID"));
}

export const getShellData = cache(async (userId: string) => {
  const month = getCurrentMonthKey();
  const memberships = await queryCurrentUserWalletIds(userId);
  const walletIds = memberships.map((item) => item.wallet_id);
  const [wallets, memberRows, budgets, profiles] = await Promise.all([
    queryWallets(walletIds),
    queryWalletMembers(walletIds),
    queryBudgets(walletIds, month),
    queryProfiles([userId])
  ]);

  return {
    userName: profiles[0]?.full_name || profiles[0]?.email || "Pengguna",
    walletCount: wallets.length,
    budgetCount: budgets.length,
    memberCount: new Set(memberRows.map((row) => row.user_id)).size,
    primaryWalletId: wallets[0]?.id ?? null
  } satisfies ShellData;
});

export const getDashboardData = cache(async (userId: string) => {
  const month = getCurrentMonthKey();
  const memberships = await queryCurrentUserWalletIds(userId);
  const walletIds = memberships.map((item) => item.wallet_id);
  const [shell, wallets, memberRows, budgets, transactions, categories, splits] = await Promise.all([
    getShellData(userId),
    queryWallets(walletIds),
    queryWalletMembers(walletIds),
    queryBudgets(walletIds, month),
    queryTransactions(walletIds, 8),
    queryCategories(walletIds),
    queryTransactionSplits(walletIds)
  ]);

  const allTransactions = await queryTransactions(walletIds);
  const walletSummaries = buildWalletSummaries({
    memberships,
    wallets,
    memberRows,
    transactions: allTransactions,
    budgets,
    month
  });
  const walletNameById = new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const recentTransactions = transactions.map((transaction) => ({
    id: transaction.id,
    walletId: transaction.wallet_id,
    walletName: walletNameById.get(transaction.wallet_id) ?? "Wallet",
    category: transaction.category_id ? categoryById.get(transaction.category_id)?.name ?? "Tanpa kategori" : "Tanpa kategori",
    title: transaction.note || (transaction.kind === "income" ? "Pemasukan" : "Pengeluaran"),
    kind: transaction.kind,
    amount: transaction.amount,
    date: transaction.happened_at,
    splitLabel: transaction.split_type === "equal" ? "Split rata" : transaction.split_type === "custom" ? "Split custom" : "-"
  }));

  const currentRange = getMonthDateRange(month);
  const currentMonthTransactions = allTransactions.filter(
    (row) => row.happened_at.slice(0, 10) >= currentRange.start && row.happened_at.slice(0, 10) <= currentRange.end
  );

  const categorySpendMap = new Map<string, { value: number; color: string }>();
  currentMonthTransactions
    .filter((row) => row.kind === "expense")
    .forEach((transaction) => {
      const category = transaction.category_id ? categoryById.get(transaction.category_id) : null;
      const key = category?.name ?? "Tanpa kategori";
      const current = categorySpendMap.get(key) ?? { value: 0, color: category?.color ?? "#595f3d" };
      current.value += transaction.amount;
      categorySpendMap.set(key, current);
    });

  return {
    shell,
    totalBalance: walletSummaries.reduce((total, wallet) => total + wallet.balance, 0),
    totalExpenseThisMonth: currentMonthTransactions.filter((row) => row.kind === "expense").reduce((total, row) => total + row.amount, 0),
    outstandingSplit: splits.reduce((total, row) => total + Math.max(row.owed_amount - row.paid_amount, 0), 0),
    wallets: walletSummaries,
    recentTransactions,
    categorySpend: [...categorySpendMap.entries()]
      .map(([name, item]) => ({ name, value: item.value, color: item.color }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 4)
  } satisfies DashboardData;
});

export const getWalletBundle = cache(async (userId: string, walletId: string) => {
  const month = getCurrentMonthKey();
  const memberships = await queryCurrentUserWalletIds(userId);
  const walletIds = memberships.map((item) => item.wallet_id);

  if (!walletIds.includes(walletId)) {
    return null;
  }

  const [shell, wallets, memberRows, categories, budgets, transactions, templates, settlements] = await Promise.all([
    getShellData(userId),
    queryWallets([walletId]),
    queryWalletMembers([walletId]),
    queryCategories([walletId]),
    queryBudgets([walletId], month),
    queryTransactions([walletId]),
    queryTemplates([walletId]),
    querySettlements([walletId])
  ]);

  const wallet = wallets[0];

  if (!wallet) {
    return null;
  }

  const summaries = buildWalletSummaries({
    memberships,
    wallets: [wallet],
    memberRows,
    transactions,
    budgets,
    month
  });

  const memberIds = [...new Set(memberRows.map((row) => row.user_id))];
  const profiles = await queryProfiles(memberIds);
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return {
    shell,
    profileMap,
    categories,
    budgets,
    members: memberRows,
    settlements,
    templates,
    transactions,
    wallet: summaries[0]
  } satisfies WalletBundle;
});

export function buildMonthlyReport(transactions: TransactionRow[]) {
  const monthlyMap = new Map<string, { income: number; expense: number }>();

  transactions.forEach((transaction) => {
    const monthKey = transaction.happened_at.slice(0, 7);
    const current = monthlyMap.get(monthKey) ?? { income: 0, expense: 0 };

    if (transaction.kind === "income") {
      current.income += transaction.amount;
    } else {
      current.expense += transaction.amount;
    }

    monthlyMap.set(monthKey, current);
  });

  return [...monthlyMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, value]) => ({
      month,
      label: new Intl.DateTimeFormat("id-ID", { month: "short" }).format(new Date(`${month}-01T00:00:00.000Z`)),
      income: value.income,
      expense: value.expense
    }));
}

export function describeBudgetUsage(used: number, limit: number) {
  if (limit <= 0) {
    return "Belum ada limit";
  }

  const percentage = Math.round((used / limit) * 100);
  return `${formatCurrency(used)} dari ${formatCurrency(limit)} (${percentage}%)`;
}
