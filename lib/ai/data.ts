import "server-only";

// AI data access, split by domain in lib/ai/data/.
// This file re-exports the public API so existing imports keep working.

export type {
  AiWalletOption,
  AiFinancialRecap,
  AiBudgetStatus,
  AiTransactionItem,
  AiTransactionQueryResult,
  AiCategoryOption,
  AiCreateTransactionParams,
  AiCreateTransactionResult,
  AiCategoryFocus,
  AiBudgetMutationParams,
  AiBudgetUpdateParams,
  AiBudgetDeleteParams,
  AiBudgetMutationResult
} from "@/lib/ai/data/types";
export {
  resolveWalletIdByName,
  getAiWalletOptions
} from "@/lib/ai/data/shared";
export {
  getCategoriesForWallets,
  resolveCategoryByName
} from "@/lib/ai/data/categories";
export {
  getFinancialRecapForUser,
  getCategoryFocusForUser,
  getRecentTransactionsForUser
} from "@/lib/ai/data/recap";
export {
  createTransactionViaAi
} from "@/lib/ai/data/transactions";
export {
  getBudgetStatusForUser,
  createBudgetViaAi,
  updateBudgetViaAi,
  deleteBudgetViaAi
} from "@/lib/ai/data/budgets";
