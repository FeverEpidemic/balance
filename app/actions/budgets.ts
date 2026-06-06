"use server";

import { requireUser } from "@/lib/auth";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import {
  errorResult,
  getNumericValue,
  getStringValue,
  revalidateWalletPaths,
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

  if (amount === null || amount < 0) {
    return errorResult("Nominal budget tidak valid.");
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
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  return successResult("Budget berhasil disimpan.", { resetForm: true });
}

export async function updateBudget(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, budgetId, categoryId, monthStart, amount } = readBudgetForm(formData);
  const { supabase, user } = await requireUser();

  if (!budgetId) {
    return errorResult("Budget tidak ditemukan.");
  }

  if (amount === null || amount < 0) {
    return errorResult("Nominal budget tidak valid.");
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
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  return successResult("Budget berhasil diperbarui.");
}

export async function deleteBudget(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, budgetId } = readBudgetForm(formData);
  const { supabase } = await requireUser();

  if (!budgetId) {
    return errorResult("Budget tidak ditemukan.");
  }

  const { error } = await supabase.from("budgets").delete().eq("id", budgetId).eq("wallet_id", walletId);

  if (error) {
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  return successResult("Budget berhasil dihapus.");
}
