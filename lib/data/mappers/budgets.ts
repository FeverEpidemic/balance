import { describeBudgetUsage } from "@/lib/finance";
import { isBalanceAdjustmentCategory } from "@/lib/balance-adjustments";
import { defaultLocale, translate, type AppLocale } from "@/lib/i18n";
import type {
  BudgetProgressItem,
  BudgetRow,
  BudgetsPageData,
  CategoryRow,
  ShellData,
  TransactionRow,
  WalletMemberRow,
  WalletRow
} from "@/lib/data/types";
import { isSamePeriod, getPreviousPeriod } from "@/lib/data/mappers/shared";
import { getCurrentUserRole } from "@/lib/data/mappers/wallets";

/**
 * Menghitung carry-over amount untuk kategori budget tertentu.
 * Rekursif & memoized: sisa budget bulan lalu di-chain ke bulan berikutnya.
 */
function calculateCarryOver(
  categoryId: string,
  periodKey: string,
  allBudgets: BudgetRow[],
  transactions: TransactionRow[],
  memo: Map<string, number>,
  cycleDay: number = 1
): number {
  // Salary period = always reset, no carry-over
  if (cycleDay > 1) return 0;

  const key = `${categoryId}-${periodKey}`;
  if (memo.has(key)) return memo.get(key)!;

  const prevPeriodKey = getPreviousPeriod(periodKey, cycleDay);
  const prevBudget = allBudgets.find(
    (b) => b.category_id === categoryId && b.month_start === prevPeriodKey
  );

  // Jika bulan lalu tidak ada budget atau carry-over tidak diaktifkan, sisa = 0
  if (!prevBudget || !prevBudget.carry_over_enabled) {
    memo.set(key, 0);
    return 0;
  }

  // Hitung sisa budget bulan lalu (termasuk carry-over dari bulan sebelumnya)
  const prevCarryOver = calculateCarryOver(categoryId, prevPeriodKey, allBudgets, transactions, memo, cycleDay);
  const prevTotalBudget = prevBudget.amount + prevCarryOver;

  const prevSpent = transactions
    .filter(
      (t) =>
        t.kind === "expense" &&
        t.category_id === categoryId &&
        isSamePeriod(t.happened_at, prevPeriodKey, cycleDay)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const prevRemaining = Math.max(0, prevTotalBudget - prevSpent);
  memo.set(key, prevRemaining);
  return prevRemaining;
}

export function buildBudgetProgressItems(args: {
  budgets: BudgetRow[];
  allBudgets: BudgetRow[];
  transactions: TransactionRow[];
  categories: CategoryRow[];
  month: string;
  cycleDay?: number;
  locale?: AppLocale;
  currency?: string;
}) {
  const { budgets, allBudgets, transactions, categories, month, cycleDay = 1, currency = "IDR" } = args;
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const carryOverMemo = new Map<string, number>();

  return budgets
    .filter((budget) => isSamePeriod(budget.month_start, month, cycleDay))
    .map((budget) => {
      const used = transactions
        .filter((transaction) =>
          transaction.kind === "expense" &&
          transaction.category_id === budget.category_id &&
          isSamePeriod(transaction.happened_at, month, cycleDay)
        )
        .reduce((total, transaction) => total + transaction.amount, 0);

      const carryOverAmount = calculateCarryOver(
        budget.category_id, month, allBudgets, transactions, carryOverMemo, cycleDay
      );
      const totalBudget = budget.amount + carryOverAmount;

      return {
        id: budget.id,
        categoryId: budget.category_id,
        categoryName: categoryById.get(budget.category_id)?.name ?? translate(args.locale ?? defaultLocale, "common.noCategory"),
        monthStart: budget.month_start,
        amount: budget.amount,
        carryOverEnabled: budget.carry_over_enabled,
        carryOverAmount,
        totalBudget,
        used,
        ratio: totalBudget > 0 ? Math.min((used / totalBudget) * 100, 100) : 0,
        usageLabel: describeBudgetUsage(used, totalBudget, currency)
      } satisfies BudgetProgressItem;
    });
}

export function createBudgetsPageData(args: {
  shell: ShellData;
  wallet: WalletRow;
  memberships: WalletMemberRow[];
  categories: CategoryRow[];
  budgets: BudgetRow[];
  allBudgets: BudgetRow[];
  transactions: TransactionRow[];
  selectedMonth: string;
  cycleDay?: number;
}) {
  const { shell, wallet, memberships, categories, budgets, allBudgets, transactions, selectedMonth, cycleDay = 1 } = args;
  const expenseCategories = categories.filter((category) => category.kind === "expense" && !isBalanceAdjustmentCategory(category));
  const walletTransactions = transactions.filter((transaction) => transaction.wallet_id === wallet.id);

  return {
    shell,
    walletId: wallet.id,
    walletName: wallet.name,
    currentUserRole: getCurrentUserRole(memberships, wallet.id),
    selectedMonth,
    categories: expenseCategories,
    salaryCycleDay: cycleDay,
    budgets: buildBudgetProgressItems({
      budgets,
      allBudgets,
      transactions: walletTransactions,
      categories: expenseCategories,
      month: selectedMonth,
      cycleDay,
      currency: wallet.currency
    })
  } satisfies BudgetsPageData;
}
