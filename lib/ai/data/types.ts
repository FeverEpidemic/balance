import "server-only";
import type { RekapPeriod } from "@/lib/chat-auth";
import type { CategoryRow, TransactionKind, TransactionRow, WalletRow } from "@/lib/data/types";

export type AiWalletOption = {
  id: string;
  name: string;
  kind: WalletRow["kind"];
  salaryCycleDay: number;
};

export type AiFinancialRecap = {
  period: RekapPeriod;
  range: { start: string; end: string };
  walletId: string | null;
  walletLabel: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  topExpenseCategories: Array<{ categoryId: string | null; categoryName: string; total: number }>;
  perWallet: Array<{ walletId: string; walletName: string; totalIncome: number; totalExpense: number; net: number; transactionCount: number }>;
  isSalaryPeriod: boolean;
  salaryPeriodLabel: string | null;
};

export type AiBudgetStatus = {
  walletId: string;
  walletName: string;
  month: string;
  totalBudget: number;
  totalSpent: number;
  usagePercent: number;
  categories: Array<{
    budgetId: string;
    categoryId: string;
    categoryName: string;
    budget: number;
    spent: number;
    remaining: number;
    usagePercent: number;
  }>;
};

export type AiTransactionItem = {
  id: string;
  walletId: string;
  walletName: string;
  amount: number;
  kind: TransactionRow["kind"];
  happenedAt: string;
  note: string | null;
  categoryName: string;
};

export type AiTransactionQueryResult = {
  totalMatched: number;
  startDate: string | null;
  endDate: string | null;
  items: AiTransactionItem[];
};

export type AiCategoryOption = {
  id: string;
  walletId: string;
  walletName: string;
  name: string;
  kind: CategoryRow["kind"];
  color: string;
  isSystem: boolean;
};

export type AiCreateTransactionParams = {
  walletId: string;
  kind: TransactionKind;
  amount: number;
  categoryId?: string | null;
  categoryName?: string | null;
  note?: string | null;
  happenedAt?: string | null;
};

export type AiCreateTransactionResult = {
  ok: boolean;
  code?: string;
  message: string;
  transaction?: {
    id: string;
    walletId: string;
    walletName: string;
    kind: TransactionKind;
    amount: number;
    happenedAt: string;
    categoryId: string | null;
    categoryName: string;
    note: string | null;
    source: "manual";
  };
};

export type AiCategoryFocus = {
  categoryId: string;
  categoryName: string;
  categoryKind: TransactionKind;
  totalAmount: number;
  transactionCount: number;
  walletNames: string[];
  recentNotes: string[];
  budget?: {
    month: string;
    amount: number;
    spent: number;
    remaining: number;
    usagePercent: number;
    status: "safe" | "warning" | "over";
  } | null;
  previousPeriod?: {
    range: { start: string; end: string };
    totalAmount: number;
    transactionCount: number;
    deltaAmount: number;
    deltaPercent: number | null;
  } | null;
};

export type AiBudgetMutationParams = {
  walletId: string;
  categoryId: string;
  monthStart: string;
  amount: number;
};

export type AiBudgetUpdateParams = {
  walletId: string;
  budgetId: string;
  amount: number;
};

export type AiBudgetDeleteParams = {
  walletId: string;
  budgetId: string;
};

export type AiBudgetMutationResult = {
  ok: boolean;
  code?: string;
  message: string;
  budget?: {
    id: string;
    walletId: string;
    walletName: string;
    categoryId: string;
    categoryName: string;
    monthStart: string;
    amount: number;
  };
};
