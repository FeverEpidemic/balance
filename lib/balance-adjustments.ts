import type { CategoryRow, TransactionKind, TransactionSource } from "@/lib/data/types";
import { defaultLocale, translate, type AppLocale } from "@/lib/i18n";

export const BALANCE_ADJUSTMENT_CATEGORY_NAMES: Record<TransactionKind, string> = {
  income: "Penyesuaian Saldo Masuk",
  expense: "Penyesuaian Saldo Keluar"
};

export const BALANCE_ADJUSTMENT_SOURCE: TransactionSource = "balance_adjustment";
export const MANUAL_TRANSACTION_SOURCE: TransactionSource = "manual";
export const SAVING_ADJUSTMENT_SOURCE: TransactionSource = "saving_adjustment";

export type BalanceAdjustmentDirection = "increase" | "decrease";

export function getBalanceAdjustmentCategoryName(kind: TransactionKind) {
  return BALANCE_ADJUSTMENT_CATEGORY_NAMES[kind];
}

export function getBalanceAdjustmentTitle(kind: TransactionKind) {
  return kind === "income" ? "Penyesuaian saldo masuk" : "Penyesuaian saldo keluar";
}

export function getBalanceAdjustmentKind(direction: BalanceAdjustmentDirection): TransactionKind {
  return direction === "increase" ? "income" : "expense";
}

export function isBalanceAdjustmentCategory(category: Pick<CategoryRow, "kind" | "name" | "is_system">) {
  return category.is_system && category.name === BALANCE_ADJUSTMENT_CATEGORY_NAMES[category.kind];
}

export function isBalanceAdjustmentSource(source: TransactionSource) {
  return source === BALANCE_ADJUSTMENT_SOURCE;
}

export function isSavingAdjustmentSource(source: TransactionSource) {
  return source === SAVING_ADJUSTMENT_SOURCE;
}

export function getBalanceAdjustmentValidationError(input: {
  amount: number | null;
  happenedAt: string;
  note: string;
  isValidDate: boolean;
}, locale: AppLocale = defaultLocale) {
  if (!input.happenedAt || !input.isValidDate) {
    return translate(locale, "actionErrors.balanceAdjustmentDateInvalid");
  }

  if (!input.amount || input.amount <= 0) {
    return translate(locale, "actionErrors.balanceAdjustmentAmountInvalid");
  }

  if (!input.note.trim()) {
    return translate(locale, "actionErrors.balanceAdjustmentReasonRequired");
  }

  return null;
}
