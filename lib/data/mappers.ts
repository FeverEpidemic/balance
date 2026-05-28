import { describeBudgetUsage, getMonthDateRange } from "@/lib/finance";
import type {
  BudgetProgressItem,
  BudgetRow,
  BudgetsPageData,
  CategoryRow,
  DashboardCategorySpend,
  DashboardData,
  DashboardRecentTransaction,
  ShellData,
  TemplateRow,
  TransactionRow,
  TransactionSplitRow,
  TransactionsPageData,
  WalletMemberRow,
  WalletOverviewData,
  WalletRole,
  WalletRoleSummary,
  WalletRow,
  WalletSummary
} from "@/lib/data/types";

function isSameMonth(dateValue: string, month: string) {
  return dateValue.slice(0, 7) === month;
}

export function sumBalance(transactions: TransactionRow[]) {
  return transactions.reduce((total, transaction) => {
    return total + (transaction.kind === "income" ? transaction.amount : -transaction.amount);
  }, 0);
}

export function getCurrentUserRole(memberships: WalletMemberRow[], walletId: string): WalletRole {
  return memberships.find((membership) => membership.wallet_id === walletId)?.role ?? "viewer";
}

export function buildWalletRoleSummary(memberRows: WalletMemberRow[]): WalletRoleSummary[] {
  const roles: WalletRole[] = ["owner", "editor", "viewer"];

  return roles.map((role) => ({
    role,
    count: memberRows.filter((member) => member.role === role).length
  }));
}

export function buildWalletSummaries(args: {
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

export function buildRecentTransactions(transactions: TransactionRow[], categories: CategoryRow[], wallets: WalletRow[]) {
  const walletNameById = new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return transactions.map((transaction) => ({
    id: transaction.id,
    walletId: transaction.wallet_id,
    walletName: walletNameById.get(transaction.wallet_id) ?? "Wallet",
    category: transaction.category_id ? categoryById.get(transaction.category_id)?.name ?? "Tanpa kategori" : "Tanpa kategori",
    title: transaction.note || (transaction.kind === "income" ? "Pemasukan" : "Pengeluaran"),
    kind: transaction.kind,
    amount: transaction.amount,
    date: transaction.happened_at,
    splitLabel: transaction.split_type === "equal" ? "Split rata" : transaction.split_type === "custom" ? "Split custom" : "-"
  })) satisfies DashboardRecentTransaction[];
}

export function buildCategorySpend(transactions: TransactionRow[], categories: CategoryRow[]) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const categorySpendMap = new Map<string, { value: number; color: string }>();

  transactions
    .filter((row) => row.kind === "expense")
    .forEach((transaction) => {
      const category = transaction.category_id ? categoryById.get(transaction.category_id) : null;
      const key = category?.name ?? "Tanpa kategori";
      const current = categorySpendMap.get(key) ?? { value: 0, color: category?.color ?? "#595f3d" };
      current.value += transaction.amount;
      categorySpendMap.set(key, current);
    });

  return [...categorySpendMap.entries()]
    .map(([name, item]) => ({ name, value: item.value, color: item.color }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 4) satisfies DashboardCategorySpend[];
}

export function filterTransactionsByMonth(transactions: TransactionRow[], month: string) {
  return transactions.filter((transaction) => isSameMonth(transaction.happened_at, month));
}

export function buildTransactionListItems(transactions: TransactionRow[], categories: CategoryRow[]) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return transactions.map((transaction) => ({
    id: transaction.id,
    kind: transaction.kind,
    categoryId: transaction.category_id,
    categoryName: transaction.category_id ? categoryById.get(transaction.category_id)?.name ?? "Tanpa kategori" : "Tanpa kategori",
    amount: transaction.amount,
    note: transaction.note,
    happenedAt: transaction.happened_at,
    splitType: transaction.split_type,
    splitLabel: transaction.split_type === "equal" ? "Split rata" : transaction.split_type === "custom" ? "Split custom" : "-",
    title: transaction.note || (transaction.kind === "income" ? "Pemasukan" : "Pengeluaran")
  }));
}

export function buildBudgetProgressItems(args: {
  budgets: BudgetRow[];
  transactions: TransactionRow[];
  categories: CategoryRow[];
  month: string;
}) {
  const { budgets, transactions, categories, month } = args;
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return budgets
    .filter((budget) => isSameMonth(budget.month_start, month))
    .map((budget) => {
      const used = transactions
        .filter((transaction) => transaction.kind === "expense" && transaction.category_id === budget.category_id && isSameMonth(transaction.happened_at, month))
        .reduce((total, transaction) => total + transaction.amount, 0);

      return {
        id: budget.id,
        categoryId: budget.category_id,
        categoryName: categoryById.get(budget.category_id)?.name ?? "Kategori",
        monthStart: budget.month_start,
        amount: budget.amount,
        used,
        ratio: budget.amount > 0 ? Math.min((used / budget.amount) * 100, 100) : 0,
        usageLabel: describeBudgetUsage(used, budget.amount)
      } satisfies BudgetProgressItem;
    });
}

export function createDashboardData(args: {
  shell: ShellData;
  memberships: WalletMemberRow[];
  wallets: WalletRow[];
  memberRows: WalletMemberRow[];
  budgets: BudgetRow[];
  recentTransactions: TransactionRow[];
  allTransactions: TransactionRow[];
  categories: CategoryRow[];
  splits: TransactionSplitRow[];
  month: string;
}) {
  const { shell, memberships, wallets, memberRows, budgets, recentTransactions, allTransactions, categories, splits, month } = args;
  const walletSummaries = buildWalletSummaries({
    memberships,
    wallets,
    memberRows,
    transactions: allTransactions,
    budgets,
    month
  });
  const currentMonthTransactions = filterTransactionsByMonth(allTransactions, month);

  return {
    shell,
    totalBalance: walletSummaries.reduce((total, wallet) => total + wallet.balance, 0),
    totalExpenseThisMonth: currentMonthTransactions.filter((row) => row.kind === "expense").reduce((total, row) => total + row.amount, 0),
    outstandingSplit: splits.reduce((total, row) => total + Math.max(row.owed_amount - row.paid_amount, 0), 0),
    wallets: walletSummaries,
    recentTransactions: buildRecentTransactions(recentTransactions, categories, wallets),
    categorySpend: buildCategorySpend(currentMonthTransactions, categories)
  } satisfies DashboardData;
}

export function createWalletOverviewData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  memberRows: WalletMemberRow[];
  categories: CategoryRow[];
  budgets: BudgetRow[];
  transactions: TransactionRow[];
  templates: TemplateRow[];
  month: string;
}) {
  const { shell, wallet, memberships, memberRows, categories, budgets, transactions, templates, month } = args;
  const [summary] = buildWalletSummaries({
    memberships,
    wallets: [wallet],
    memberRows,
    transactions,
    budgets,
    month
  });

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    wallet: summary,
    hasTransactions: transactions.length > 0,
    transactionCount: transactions.length,
    categoryCount: categories.length,
    activeBudgetCount: budgets.length,
    templateCount: templates.length,
    roleSummary: buildWalletRoleSummary(memberRows)
  } satisfies WalletOverviewData;
}

export function createTransactionsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  transactions: TransactionRow[];
  selectedMonth: string;
}) {
  const { shell, wallet, memberships, categories, transactions, selectedMonth } = args;
  const formCategories = categories.filter((category) => category.kind === "expense" || category.kind === "income");
  const walletTransactions = transactions.filter((transaction) => transaction.wallet_id === wallet.id);
  const filteredTransactions = filterTransactionsByMonth(walletTransactions, selectedMonth);

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: formCategories,
    transactions: buildTransactionListItems(filteredTransactions, formCategories).slice(0, 12)
  } satisfies TransactionsPageData;
}

export function createBudgetsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  budgets: BudgetRow[];
  transactions: TransactionRow[];
  selectedMonth: string;
}) {
  const { shell, wallet, memberships, categories, budgets, transactions, selectedMonth } = args;
  const expenseCategories = categories.filter((category) => category.kind === "expense");
  const walletTransactions = transactions.filter((transaction) => transaction.wallet_id === wallet.id);

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: expenseCategories,
    budgets: buildBudgetProgressItems({
      budgets,
      transactions: walletTransactions,
      categories: expenseCategories,
      month: selectedMonth
    })
  } satisfies BudgetsPageData;
}

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
      label: new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00.000Z`)),
      income: value.income,
      expense: value.expense
    }));
}
