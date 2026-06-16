import type { CategoryRow, TransactionKind, TransactionSource } from "@/lib/data/types";
import { defaultLocale, translate, type AppLocale } from "@/lib/i18n";

export const BALANCE_ADJUSTMENT_CATEGORY_NAMES: Record<TransactionKind, string> = {
  income: "Penyesuaian Saldo Masuk",
  expense: "Penyesuaian Saldo Keluar"
};

export const BALANCE_ADJUSTMENT_CATEGORY_COLORS: Record<TransactionKind, string> = {
  income: "#6f8f78",
  expense: "#8e7558"
};

export const BALANCE_ADJUSTMENT_SOURCE: TransactionSource = "balance_adjustment";
export const MANUAL_TRANSACTION_SOURCE: TransactionSource = "manual";
export const SAVING_ADJUSTMENT_SOURCE: TransactionSource = "saving_adjustment";

export type BalanceAdjustmentDirection = "increase" | "decrease";
export type BalanceAdjustmentResolution = {
  amount: number;
  direction: BalanceAdjustmentDirection;
  kind: TransactionKind;
};

export function getBalanceAdjustmentCategoryName(kind: TransactionKind) {
  return BALANCE_ADJUSTMENT_CATEGORY_NAMES[kind];
}

export function getBalanceAdjustmentCategoryColor(kind: TransactionKind) {
  return BALANCE_ADJUSTMENT_CATEGORY_COLORS[kind];
}

export function getBalanceAdjustmentTitle(kind: TransactionKind) {
  return kind === "income" ? "Penyesuaian saldo masuk" : "Penyesuaian saldo keluar";
}

export function getBalanceAdjustmentKind(direction: BalanceAdjustmentDirection): TransactionKind {
  return direction === "increase" ? "income" : "expense";
}

export function resolveBalanceAdjustment(recordedBalance: number, actualBalance: number): BalanceAdjustmentResolution | null {
  const difference = actualBalance - recordedBalance;

  if (difference === 0) {
    return null;
  }

  const direction = difference > 0 ? "increase" : "decrease";

  return {
    amount: Math.abs(difference),
    direction,
    kind: getBalanceAdjustmentKind(direction)
  };
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
  actualBalance: number | null;
  happenedAt: string;
  note: string;
  isValidDate: boolean;
}, locale: AppLocale = defaultLocale) {
  if (!input.happenedAt || !input.isValidDate) {
    return translate(locale, "actionErrors.balanceAdjustmentDateInvalid");
  }

  if (input.actualBalance === null) {
    return translate(locale, "actionErrors.balanceAdjustmentAmountInvalid");
  }

  if (!input.note.trim()) {
    return translate(locale, "actionErrors.balanceAdjustmentReasonRequired");
  }

  return null;
}
