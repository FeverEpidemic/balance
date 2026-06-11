import type { CategoryRow, TransactionKind } from "@/lib/data/types";

export const DEFAULT_CATEGORY_COLOR = "#595f3d";

export const CATEGORY_COLOR_PALETTE = [
  "#2f7d5c",
  "#4c956c",
  "#5d7a74",
  "#6b705c",
  "#5f6d5b",
  "#52624d",
  "#7b6d52",
  "#8c7b5a",
  "#8b6f61",
  "#8d5a5a",
  "#6e5b7b",
  "#6a6f7d",
  "#8a5f73",
  "#66806a",
  "#717171"
] as const;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function normalizeCategoryName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function isValidCategoryKind(value: string): value is TransactionKind {
  return value === "income" || value === "expense";
}

export function isValidCategoryColor(color: string) {
  return HEX_COLOR_PATTERN.test(color);
}

export function isSystemManagedCategory(category: Pick<CategoryRow, "is_system">) {
  return category.is_system;
}
