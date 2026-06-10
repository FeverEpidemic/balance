"use server";

import { requireUser } from "@/lib/auth";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import {
  errorResult,
  getActionTranslator,
  getWalletMemberUserIds,
  getNumericValue,
  getStringValue,
  revalidateWalletPaths,
  safeDbError,
  successResult,
  type ActionResult
} from "@/app/actions/_shared";

function readBudgetForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    budgetId: getStringValue(formData, "budget_id"),
    categoryId: getStringValue(formData, "category_id"),
    monthStart: getStringValue(formData, "month_start"),
    amount: getNumericValue(formData, "amount")
  };
}

export async function createBudget(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, categoryId, monthStart, amount } = readBudgetForm(formData);
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  if (amount === null || amount < 0) {
    return errorResult(t("actionErrors.budgetAmountInvalid"));
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      wallet_id: walletId,
      category_id: categoryId,
      month_start: `${monthStart}-01`,
      amount,
      created_by: user.id,
      updated_by: user.id
    },
    {
      onConflict: "wallet_id,category_id,month_start"
    }
  );

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  return successResult(t("actionSuccess.budgetSaved"), { resetForm: true });
}

export async function updateBudget(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, budgetId, categoryId, monthStart, amount } = readBudgetForm(formData);
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  if (!budgetId) {
    return errorResult(t("actionErrors.budgetNotFound"));
  }

  if (amount === null || amount < 0) {
    return errorResult(t("actionErrors.budgetAmountInvalid"));
  }

  const { error } = await supabase
    .from("budgets")
    .update({
      category_id: categoryId,
      month_start: `${monthStart}-01`,
      amount,
      updated_by: user.id
    })
    .eq("id", budgetId)
    .eq("wallet_id", walletId);

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  return successResult(t("actionSuccess.budgetUpdated"));
}

export async function deleteBudget(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, budgetId } = readBudgetForm(formData);
  const { supabase } = await requireUser();
  const t = await getActionTranslator();

  if (!budgetId) {
    return errorResult(t("actionErrors.budgetNotFound"));
  }

  const { error } = await supabase.from("budgets").delete().eq("id", budgetId).eq("wallet_id", walletId);

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);
  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  return successResult(t("actionSuccess.budgetDeleted"));
}
