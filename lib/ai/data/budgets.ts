import "server-only";
import { getCurrentMonthKey, getSalaryPeriodRange } from "@/lib/finance";
import { invalidateAiInsightCache, invalidateWalletReadCaches } from "@/lib/data/cache";
import { invalidateAiReadCache } from "@/lib/ai/cache";
import { queryBudgets, queryCategories, queryTransactions } from "@/lib/data/queries";
import type { BudgetRow, CategoryRow, TransactionRow } from "@/lib/data/types";
import { createClient } from "@/lib/supabase/server";
import { getActionTranslator, getWalletMemberUserIds, revalidateWalletPaths } from "@/app/actions/_shared";
import type {
  AiBudgetStatus,
  AiBudgetMutationParams,
  AiBudgetUpdateParams,
  AiBudgetDeleteParams,
  AiBudgetMutationResult
} from "@/lib/ai/data/types";
import {
  getAccessibleWallets,
  assertAccessibleWallet,
  buildCategoryMap,
  buildWalletMap
} from "@/lib/ai/data/shared";
import { getCategoriesForWallets } from "@/lib/ai/data/categories";

function groupSpentByCategory(transactions: TransactionRow[]) {
  const totals = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (transaction.kind !== "expense" || !transaction.category_id) {
      return;
    }

    totals.set(transaction.category_id, (totals.get(transaction.category_id) ?? 0) + transaction.amount);
  });

  return totals;
}

function buildBudgetCategories(budgets: BudgetRow[], categories: CategoryRow[], spendByCategory: Map<string, number>) {
  const categoryMap = buildCategoryMap(categories);

  return budgets
    .map((budget) => {
      const spent = spendByCategory.get(budget.category_id) ?? 0;
      const categoryName = categoryMap.get(budget.category_id)?.name ?? "Tanpa kategori";
      const usagePercent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

      return {
        budgetId: budget.id,
        categoryId: budget.category_id,
        categoryName,
        budget: budget.amount,
        spent,
        remaining: budget.amount - spent,
        usagePercent
      };
    })
    .sort((a, b) => b.usagePercent - a.usagePercent);
}

export async function getBudgetStatusForUser(userId: string, walletId: string): Promise<AiBudgetStatus> {
  const { walletIds, wallets } = await getAccessibleWallets(userId);
  assertAccessibleWallet(walletIds, walletId);
  const month = getCurrentMonthKey();

  // Gunakan salary period untuk filter transaksi
  const targetWallet = wallets.find((w) => w.id === walletId);
  const cycleDay = targetWallet?.salary_cycle_day ?? 1;
  const range = getSalaryPeriodRange(month, cycleDay);

  const [budgets, categories, transactions] = await Promise.all([
    queryBudgets([walletId], month),
    queryCategories([walletId]),
    queryTransactions([walletId])
  ]);

  const spendByCategory = groupSpentByCategory(
    transactions.filter((transaction) => {
      const happenedAt = transaction.happened_at.slice(0, 10);
      return happenedAt >= range.start && happenedAt <= range.end;
    })
  );
  const categoriesWithUsage = buildBudgetCategories(budgets, categories, spendByCategory);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = categoriesWithUsage.reduce((sum, category) => sum + category.spent, 0);

  return {
    walletId,
    walletName: wallets.find((wallet) => wallet.id === walletId)?.name ?? "Wallet",
    month,
    totalBudget,
    totalSpent,
    usagePercent: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    categories: categoriesWithUsage
  };
}

export async function createBudgetViaAi(
  userId: string,
  params: AiBudgetMutationParams
): Promise<AiBudgetMutationResult> {
  const { memberships, walletIds, wallets } = await getAccessibleWallets(userId);
  const t = await getActionTranslator();
  assertAccessibleWallet(walletIds, params.walletId);

  const membership = memberships.find((item) => item.wallet_id === params.walletId);

  if (!membership || membership.role === "viewer") {
    return {
      ok: false,
      code: "BUDGET_WRITE_DENIED",
      message: t("actionErrors.budgetWriteForbidden")
    };
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return {
      ok: false,
      code: "BUDGET_AMOUNT_INVALID",
      message: t("actionErrors.budgetAmountInvalid")
    };
  }

  const walletMap = buildWalletMap(wallets);
  const categories = await getCategoriesForWallets(userId, [params.walletId]);
  const resolvedCategory = categories.find((c) => c.id === params.categoryId) ?? null;

  if (!resolvedCategory) {
    return {
      ok: false,
      code: "BUDGET_CATEGORY_NOT_FOUND",
      message: t("actionErrors.budgetCategoryNotFound")
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        wallet_id: params.walletId,
        category_id: params.categoryId,
        month_start: `${params.monthStart}-01`,
        amount: params.amount,
        created_by: userId,
        updated_by: userId
      },
      {
        onConflict: "wallet_id,category_id,month_start"
      }
    )
    .select("id, wallet_id, category_id, month_start, amount")
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: "BUDGET_UPSERT_FAILED",
      message: t("actionErrors.unexpectedError")
    };
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, params.walletId);
  await invalidateWalletReadCaches(params.walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await invalidateAiReadCache(userId);
  await revalidateWalletPaths(params.walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });

  return {
    ok: true,
    message: t("actionSuccess.budgetCreatedViaAi"),
    budget: {
      id: data.id,
      walletId: data.wallet_id,
      walletName: walletMap.get(data.wallet_id)?.name ?? "Wallet",
      categoryId: data.category_id,
      categoryName: resolvedCategory.name,
      monthStart: data.month_start,
      amount: data.amount
    }
  };
}

export async function updateBudgetViaAi(
  userId: string,
  params: AiBudgetUpdateParams
): Promise<AiBudgetMutationResult> {
  const { memberships, walletIds, wallets } = await getAccessibleWallets(userId);
  const t = await getActionTranslator();
  assertAccessibleWallet(walletIds, params.walletId);

  const membership = memberships.find((item) => item.wallet_id === params.walletId);

  if (!membership || membership.role === "viewer") {
    return {
      ok: false,
      code: "BUDGET_WRITE_DENIED",
      message: t("actionErrors.budgetWriteForbidden")
    };
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return {
      ok: false,
      code: "BUDGET_AMOUNT_INVALID",
      message: t("actionErrors.budgetAmountInvalid")
    };
  }

  const walletMap = buildWalletMap(wallets);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("budgets")
    .select("id, wallet_id, category_id, month_start, amount")
    .eq("id", params.budgetId)
    .eq("wallet_id", params.walletId)
    .single();

  if (!existing) {
    return {
      ok: false,
      code: "BUDGET_NOT_FOUND",
      message: t("actionErrors.budgetNotFound")
    };
  }

  const categories = await getCategoriesForWallets(userId, [params.walletId]);
  const resolvedCategory = categories.find((c) => c.id === existing.category_id) ?? null;

  const { data, error } = await supabase
    .from("budgets")
    .update({
      amount: params.amount,
      updated_by: userId
    })
    .eq("id", params.budgetId)
    .eq("wallet_id", params.walletId)
    .select("id, wallet_id, category_id, month_start, amount")
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: "BUDGET_UPDATE_FAILED",
      message: t("actionErrors.unexpectedError")
    };
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, params.walletId);
  await invalidateWalletReadCaches(params.walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await invalidateAiReadCache(userId);
  await revalidateWalletPaths(params.walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });

  return {
    ok: true,
    message: t("actionSuccess.budgetUpdatedViaAi"),
    budget: {
      id: data.id,
      walletId: data.wallet_id,
      walletName: walletMap.get(data.wallet_id)?.name ?? "Wallet",
      categoryId: data.category_id,
      categoryName: resolvedCategory?.name ?? "Tanpa kategori",
      monthStart: data.month_start,
      amount: data.amount
    }
  };
}

export async function deleteBudgetViaAi(
  userId: string,
  params: AiBudgetDeleteParams
): Promise<AiBudgetMutationResult> {
  const { memberships, walletIds } = await getAccessibleWallets(userId);
  const t = await getActionTranslator();
  assertAccessibleWallet(walletIds, params.walletId);

  const membership = memberships.find((item) => item.wallet_id === params.walletId);

  if (!membership || membership.role === "viewer") {
    return {
      ok: false,
      code: "BUDGET_WRITE_DENIED",
      message: t("actionErrors.budgetWriteForbidden")
    };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("budgets")
    .select("id")
    .eq("id", params.budgetId)
    .eq("wallet_id", params.walletId)
    .single();

  if (!existing) {
    return {
      ok: false,
      code: "BUDGET_NOT_FOUND",
      message: t("actionErrors.budgetNotFound")
    };
  }

  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", params.budgetId)
    .eq("wallet_id", params.walletId);

  if (error) {
    return {
      ok: false,
      code: "BUDGET_DELETE_FAILED",
      message: t("actionErrors.unexpectedError")
    };
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, params.walletId);
  await invalidateWalletReadCaches(params.walletId, {
    targets: ["overview", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await invalidateAiReadCache(userId);
  await revalidateWalletPaths(params.walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["budgets"]
  });

  return {
    ok: true,
    message: t("actionSuccess.budgetDeletedViaAi")
  };
}
