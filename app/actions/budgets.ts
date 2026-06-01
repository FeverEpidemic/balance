"use server";

import { requireUser } from "@/lib/auth";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import { getNumericValue, getStringValue, redirectToWalletSection, revalidateWalletPaths } from "@/app/actions/_shared";

function readBudgetForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    budgetId: getStringValue(formData, "budget_id"),
    categoryId: getStringValue(formData, "category_id"),
    monthStart: getStringValue(formData, "month_start"),
    amount: getNumericValue(formData, "amount")
  };
}

export async function createBudget(formData: FormData) {
  const { walletId, categoryId, monthStart, amount } = readBudgetForm(formData);
  const { supabase, user } = await requireUser();

  if (amount === null || amount < 0) {
    redirectToWalletSection(walletId, "budgets", "error", "Nominal budget tidak valid.");
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
    redirectToWalletSection(walletId, "budgets", "error", error.message);
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  redirectToWalletSection(walletId, "budgets", "message", "Budget berhasil disimpan.");
}

export async function updateBudget(formData: FormData) {
  const { walletId, budgetId, categoryId, monthStart, amount } = readBudgetForm(formData);
  const { supabase, user } = await requireUser();

  if (!budgetId) {
    redirectToWalletSection(walletId, "budgets", "error", "Budget tidak ditemukan.");
  }

  if (amount === null || amount < 0) {
    redirectToWalletSection(walletId, "budgets", "error", "Nominal budget tidak valid.");
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
    redirectToWalletSection(walletId, "budgets", "error", error.message);
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  redirectToWalletSection(walletId, "budgets", "message", "Budget berhasil diperbarui.");
}

export async function deleteBudget(formData: FormData) {
  const { walletId, budgetId } = readBudgetForm(formData);
  const { supabase } = await requireUser();

  if (!budgetId) {
    redirectToWalletSection(walletId, "budgets", "error", "Budget tidak ditemukan.");
  }

  const { error } = await supabase.from("budgets").delete().eq("id", budgetId).eq("wallet_id", walletId);

  if (error) {
    redirectToWalletSection(walletId, "budgets", "error", error.message);
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });
  redirectToWalletSection(walletId, "budgets", "message", "Budget berhasil dihapus.");
}
