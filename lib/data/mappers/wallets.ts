import { getMonthDateRange } from "@/lib/finance";
import { defaultLocale, getLocaleTag, type AppLocale } from "@/lib/i18n";
import type {
  BudgetRow,
  CategoriesPageData,
  CategoryRow,
  SavingEntryRow,
  SavingRow,
  ShellData,
  TemplateRow,
  TransactionRow,
  WalletMemberRow,
  WalletOverviewData,
  WalletRole,
  WalletRoleSummary,
  WalletRow,
  WalletSummary
} from "@/lib/data/types";

export function sumBalance(transactions: TransactionRow[]) {
  return transactions.reduce((total, transaction) => {
    return total + (transaction.kind === "income" ? transaction.amount : -transaction.amount);
  }, 0);
}

export function sumSavingFlow(entries: SavingEntryRow[]) {
  return entries.reduce((total, entry) => total + (entry.entry_type === "deposit" ? entry.amount : -entry.amount), 0);
}

export function sumSavingBalance(savings: SavingRow[]) {
  return savings.reduce((total, saving) => total + saving.current_balance, 0);
}

export function buildWalletBalanceSummary(args: {
  transactions: TransactionRow[];
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
}) {
  const transactionBalance = sumBalance(args.transactions);
  const savingBalance = sumSavingBalance(args.savings);
  const availableBalance = transactionBalance;

  return {
    availableBalance,
    savingBalance,
    totalBalance: availableBalance + savingBalance
  };
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
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  budgets: BudgetRow[];
  balancesByWallet?: Map<string, number>;
  month: string;
  locale?: AppLocale;
}) {
  const { memberships, wallets, memberRows, transactions, savings, savingEntries, budgets, balancesByWallet, month, locale = defaultLocale } = args;
  const currentRange = getMonthDateRange(month);
  const roleByWallet = new Map(memberships.map((membership) => [membership.wallet_id, membership.role]));
  const memberCountByWallet = new Map<string, number>();
  const transactionByWallet = new Map<string, TransactionRow[]>();
  const savingByWallet = new Map<string, SavingRow[]>();
  const savingEntriesByWallet = new Map<string, SavingEntryRow[]>();
  const budgetByWallet = new Map<string, BudgetRow[]>();

  memberRows.forEach((row) => {
    memberCountByWallet.set(row.wallet_id, (memberCountByWallet.get(row.wallet_id) ?? 0) + 1);
  });

  transactions.forEach((row) => {
    const current = transactionByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    transactionByWallet.set(row.wallet_id, current);
  });

  savings.forEach((row) => {
    const current = savingByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    savingByWallet.set(row.wallet_id, current);
  });

  savingEntries.forEach((row) => {
    const current = savingEntriesByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    savingEntriesByWallet.set(row.wallet_id, current);
  });

  budgets.forEach((row) => {
    const current = budgetByWallet.get(row.wallet_id) ?? [];
    current.push(row);
    budgetByWallet.set(row.wallet_id, current);
  });

  return wallets
    .map((wallet) => {
      const walletTransactions = transactionByWallet.get(wallet.id) ?? [];
      const walletSavings = savingByWallet.get(wallet.id) ?? [];
      const walletSavingEntries = savingEntriesByWallet.get(wallet.id) ?? [];
      const monthExpenses = walletTransactions
        .filter((row) => row.kind === "expense" && row.happened_at.slice(0, 10) >= currentRange.start && row.happened_at.slice(0, 10) <= currentRange.end)
        .reduce((total, row) => total + row.amount, 0);
      const monthBudget = (budgetByWallet.get(wallet.id) ?? []).reduce((total, row) => total + row.amount, 0);
      const precomputedBalance = balancesByWallet?.get(wallet.id);
      const balances = precomputedBalance !== undefined
        ? {
            availableBalance: precomputedBalance,
            savingBalance: sumSavingBalance(walletSavings),
            totalBalance: precomputedBalance + sumSavingBalance(walletSavings)
          }
        : buildWalletBalanceSummary({
            transactions: walletTransactions,
            savings: walletSavings,
            savingEntries: walletSavingEntries
          });

      return {
        id: wallet.id,
        name: wallet.name,
        kind: wallet.kind,
        role: roleByWallet.get(wallet.id) ?? "viewer",
        members: memberCountByWallet.get(wallet.id) ?? 0,
        availableBalance: balances.availableBalance,
        savingBalance: balances.savingBalance,
        totalBalance: balances.totalBalance,
        spentThisMonth: monthExpenses,
        budgetThisMonth: monthBudget,
        currency: wallet.currency
      } satisfies WalletSummary;
    })
    .sort((left, right) => left.name.localeCompare(right.name, getLocaleTag(locale)));
}

export function createWalletOverviewData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  memberRows: WalletMemberRow[];
  categories: CategoryRow[];
  budgets: BudgetRow[];
  transactions: TransactionRow[];
  savings: SavingRow[];
  savingEntries: SavingEntryRow[];
  templates: TemplateRow[];
  month: string;
  locale?: AppLocale;
}) {
  const { shell, wallet, memberships, memberRows, categories, budgets, transactions, savings, savingEntries, templates, month, locale = defaultLocale } = args;
  const [summary] = buildWalletSummaries({
    memberships,
    wallets: [wallet],
    memberRows,
    transactions,
    savings,
    savingEntries,
    budgets,
    month,
    locale
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

export function createCategoriesPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
}) {
  const { shell, wallet, memberships, categories } = args;

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    categories: categories.filter((category) => category.wallet_id === wallet.id)
  } satisfies CategoriesPageData;
}
