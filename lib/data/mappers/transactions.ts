import {
  isBalanceAdjustmentCategory,
  isBalanceAdjustmentSource,
  isSavingAdjustmentSource
} from "@/lib/balance-adjustments";
import { defaultLocale, getLocaleTag, translate, type AppLocale } from "@/lib/i18n";
import type {
  CategoryRow,
  DashboardRecentTransaction,
  ShellData,
  TransactionRow,
  TransactionHistoryPageData,
  TransactionHistorySortField,
  TransactionCreateContext,
  TransactionsPageData,
  WalletMemberRow,
  WalletRow,
  SortDirection
} from "@/lib/data/types";
import { deduplicateById, filterTransactionsByMonth } from "@/lib/data/mappers/shared";
import { getCurrentUserRole } from "@/lib/data/mappers/wallets";

export function buildRecentTransactions(
  transactions: TransactionRow[],
  categories: CategoryRow[],
  wallets: WalletRow[],
  locale: AppLocale = defaultLocale
) {
  const walletNameById = new Map(wallets.map((wallet) => [wallet.id, wallet.name]));
  const walletCurrencyById = new Map(wallets.map((wallet) => [wallet.id, wallet.currency]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return transactions.map((transaction) => ({
    id: transaction.id,
    walletId: transaction.wallet_id,
    walletName: walletNameById.get(transaction.wallet_id) ?? translate(locale, "common.wallet"),
    walletCurrency: walletCurrencyById.get(transaction.wallet_id) ?? "IDR",
    category: transaction.category_id
      ? categoryById.get(transaction.category_id)?.name ?? translate(locale, "common.noCategory")
      : translate(locale, "common.noCategory"),
    categoryColor: transaction.category_id ? categoryById.get(transaction.category_id)?.color ?? "#595f3d" : "#595f3d",
    title:
      transaction.note ||
      (isBalanceAdjustmentSource(transaction.source)
        ? transaction.kind === "income"
          ? translate(locale, "transactions.balanceAdjustmentIncome")
          : translate(locale, "transactions.balanceAdjustmentExpense")
        : isSavingAdjustmentSource(transaction.source)
          ? transaction.kind === "income"
            ? translate(locale, "savings.withdraw")
            : translate(locale, "savings.deposit")
          : transaction.kind === "income"
            ? translate(locale, "transactions.kindIncome")
            : translate(locale, "transactions.kindExpense")),
    kind: transaction.kind,
    amount: transaction.amount,
    date: transaction.happened_at,
    splitLabel:
      transaction.split_type === "equal"
        ? translate(locale, "transactions.splitEqual")
        : transaction.split_type === "custom"
          ? translate(locale, "transactions.splitCustom")
          : "-"
  })) satisfies DashboardRecentTransaction[];
}

function buildTransactionCreateCategories(categories: CategoryRow[], walletId: string) {
  return categories
    .filter((category) => category.wallet_id === walletId)
    .filter(
      (category) => (category.kind === "expense" || category.kind === "income") && !isBalanceAdjustmentCategory(category)
    )
    .filter(deduplicateById());
}

export function buildTransactionCreateContext(args: {
  shell: ShellData;
  wallets: WalletRow[];
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
}): TransactionCreateContext | null {
  const { shell, wallets, memberships, categories } = args;
  const primaryWalletId = shell.primaryWalletId;

  if (!primaryWalletId) {
    return null;
  }

  const wallet = wallets.find((item) => item.id === primaryWalletId);

  if (!wallet) {
    return null;
  }

  const role = getCurrentUserRole(memberships, wallet.id);

  if (role !== "owner" && role !== "editor") {
    return null;
  }

  return {
    walletId: wallet.id,
    walletName: wallet.name,
    walletCurrency: wallet.currency,
    categories: buildTransactionCreateCategories(categories, wallet.id)
  } satisfies TransactionCreateContext;
}

export function buildAllWalletContexts(args: {
  wallets: WalletRow[];
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
}): Record<string, TransactionCreateContext> {
  const { wallets, memberships, categories } = args;
  const result: Record<string, TransactionCreateContext> = {};

  for (const wallet of wallets) {
    const role = getCurrentUserRole(memberships, wallet.id);
    if (role !== "owner" && role !== "editor") continue;
    result[wallet.id] = {
      walletId: wallet.id,
      walletName: wallet.name,
      walletCurrency: wallet.currency,
      categories: buildTransactionCreateCategories(categories, wallet.id),
    };
  }

  return result;
}

export function buildTransactionListItems(
  transactions: TransactionRow[],
  categories: CategoryRow[],
  locale: AppLocale = defaultLocale
) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return transactions.map((transaction) => ({
    id: transaction.id,
    kind: transaction.kind,
    source: transaction.source,
    categoryId: transaction.category_id,
    categoryName: transaction.category_id
      ? categoryById.get(transaction.category_id)?.name ?? translate(locale, "common.noCategory")
      : translate(locale, "common.noCategory"),
    categoryColor: transaction.category_id ? categoryById.get(transaction.category_id)?.color ?? "#595f3d" : "#595f3d",
    amount: transaction.amount,
    note: transaction.note,
    happenedAt: transaction.happened_at ?? new Date().toISOString(),
    splitType: transaction.split_type,
    splitLabel:
      transaction.split_type === "equal"
        ? translate(locale, "transactions.splitEqual")
        : transaction.split_type === "custom"
          ? translate(locale, "transactions.splitCustom")
          : "-",
    title:
      transaction.note ||
      (isBalanceAdjustmentSource(transaction.source)
        ? transaction.kind === "income"
          ? translate(locale, "transactions.balanceAdjustmentIncome")
          : translate(locale, "transactions.balanceAdjustmentExpense")
        : transaction.saving_entry_id
          ? transaction.kind === "income"
            ? translate(locale, "savings.withdraw")
            : translate(locale, "savings.deposit")
          : transaction.kind === "income"
            ? translate(locale, "transactions.kindIncome")
            : translate(locale, "transactions.kindExpense")),
    isRecurring: Boolean(transaction.recurring_transaction_id),
    isSavingLinked: Boolean(transaction.saving_entry_id),
    isBalanceAdjustment: isBalanceAdjustmentSource(transaction.source)
  }));
}

function matchesHistorySearch(
  transaction: ReturnType<typeof buildTransactionListItems>[number],
  search: string,
  localeTag: string,
  locale: AppLocale
) {
  if (!search) {
    return true;
  }

  const haystack = [
    transaction.title,
    transaction.note ?? "",
    transaction.categoryName,
    transaction.kind,
    transaction.kind === "expense" ? translate(locale, "transactions.kindExpense") : translate(locale, "transactions.kindIncome"),
    transaction.splitLabel,
    transaction.isRecurring ? translate(locale, "transactions.metaAutomatic") : "",
    transaction.isSavingLinked ? translate(locale, "transactions.metaSavings") : "",
    transaction.isBalanceAdjustment ? translate(locale, "transactions.metaAdjustment") : ""
  ]
    .join(" ")
    .toLocaleLowerCase(localeTag);

  return haystack.includes(search);
}

function compareHistoryKind(left: ReturnType<typeof buildTransactionListItems>[number], right: ReturnType<typeof buildTransactionListItems>[number], direction: SortDirection, localeTag: string) {
  const rank = direction === "asc"
    ? { income: 0, expense: 1 }
    : { expense: 0, income: 1 };
  const leftRank = rank[left.kind];
  const rightRank = rank[right.kind];

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  return left.title.localeCompare(right.title, localeTag);
}

export function filterAndPaginateTransactionHistory(args: {
  transactions: ReturnType<typeof buildTransactionListItems>;
  searchQuery?: string;
  sortBy?: TransactionHistorySortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
  locale?: AppLocale;
}) {
  const {
    transactions,
    searchQuery = "",
    sortBy = "happened_at",
    sortDirection = "desc",
    page = 1,
    pageSize = 50,
    locale = defaultLocale
  } = args;
  const localeTag = getLocaleTag(locale);
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase(localeTag);

  const filteredTransactions = transactions.filter((transaction) => matchesHistorySearch(transaction, normalizedSearch, localeTag, locale));
  const sortedTransactions = [...filteredTransactions].sort((left, right) => {
    switch (sortBy) {
      case "amount": {
        const diff = sortDirection === "asc" ? left.amount - right.amount : right.amount - left.amount;
        if (diff !== 0) {
          return diff;
        }
        break;
      }
      case "category": {
        const diff = left.categoryName.localeCompare(right.categoryName, localeTag, { sensitivity: "base" });
        if (diff !== 0) {
          return sortDirection === "asc" ? diff : -diff;
        }
        break;
      }
      case "kind": {
        const diff = compareHistoryKind(left, right, sortDirection, localeTag);
        if (diff !== 0) {
          return diff;
        }
        break;
      }
      case "happened_at":
      default: {
        const diff = sortDirection === "asc"
          ? left.happenedAt.localeCompare(right.happenedAt)
          : right.happenedAt.localeCompare(left.happenedAt);
        if (diff !== 0) {
          return diff;
        }
        break;
      }
    }

    return right.happenedAt.localeCompare(left.happenedAt) || left.id.localeCompare(right.id);
  });

  const totalCount = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const paginatedTransactions = sortedTransactions.slice(start, start + pageSize);

  return {
    transactions: paginatedTransactions,
    totalCount,
    totalPages,
    currentPage,
    pageSize,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };
}

export function createTransactionsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  transactions: TransactionRow[];
  selectedMonth: string;
  locale?: AppLocale;
}) {
  const { shell, wallet, memberships, categories, transactions, selectedMonth, locale = defaultLocale } = args;
  const formCategories = buildTransactionCreateCategories(categories, wallet.id);
  const walletTransactions = transactions.filter((transaction) => transaction.wallet_id === wallet.id);
  const filteredTransactions = filterTransactionsByMonth(walletTransactions, selectedMonth);

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    walletCurrency: wallet.currency,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: formCategories,
    transactions: buildTransactionListItems(filteredTransactions, categories, locale).slice(0, 8)
  } satisfies TransactionsPageData;
}

export function createTransactionHistoryPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  transactions: TransactionRow[];
  selectedMonth: string;
  locale?: AppLocale;
  searchQuery?: string;
  sortBy?: TransactionHistorySortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}) {
  const {
    shell,
    wallet,
    memberships,
    categories,
    transactions,
    selectedMonth,
    locale = defaultLocale,
    searchQuery = "",
    sortBy = "happened_at",
    sortDirection = "desc",
    page = 1,
    pageSize = 50
  } = args;
  const formCategories = categories
    .filter(
      (category) => (category.kind === "expense" || category.kind === "income") && !isBalanceAdjustmentCategory(category)
    )
    .filter(deduplicateById());
  const historyTransactions = filterAndPaginateTransactionHistory({
    transactions: buildTransactionListItems(transactions, categories, locale),
    searchQuery,
    sortBy,
    sortDirection,
    page,
    pageSize,
    locale
  });

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    walletCurrency: wallet.currency,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: formCategories,
    transactions: historyTransactions.transactions,
    searchQuery,
    sortBy,
    sortDirection,
    currentPage: historyTransactions.currentPage,
    totalPages: historyTransactions.totalPages,
    totalCount: historyTransactions.totalCount,
    pageSize: historyTransactions.pageSize,
    hasPreviousPage: historyTransactions.hasPreviousPage,
    hasNextPage: historyTransactions.hasNextPage
  } satisfies TransactionHistoryPageData;
}
