import "server-only";
import { invalidateAiInsightCache, invalidateWalletReadCaches } from "@/lib/data/cache";
import { invalidateAiReadCache } from "@/lib/ai/cache";
import { consumeTransactionRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { combineDateAndTime, dateStringToISO, getTodayDateString, isValidDateString } from "@/lib/utils";
import { getActionTranslator, getWalletMemberUserIds, revalidateWalletPaths } from "@/app/actions/_shared";
import type { AiCreateTransactionParams, AiCreateTransactionResult } from "@/lib/ai/data/types";
import { getAccessibleWallets, assertAccessibleWallet, buildWalletMap } from "@/lib/ai/data/shared";
import { getCategoriesForWallets, resolveCategoryByName } from "@/lib/ai/data/categories";

function mapTransactionError(message: string, linkedSavingTransactionMessage: string) {
  if (message.includes("saving_transaction_managed_by_entries")) {
    return linkedSavingTransactionMessage;
  }

  return message;
}

export async function createTransactionViaAi(userId: string, params: AiCreateTransactionParams): Promise<AiCreateTransactionResult> {
  const { memberships, walletIds, wallets } = await getAccessibleWallets(userId);
  const t = await getActionTranslator();
  assertAccessibleWallet(walletIds, params.walletId);

  const membership = memberships.find((item) => item.wallet_id === params.walletId);

  if (!membership || membership.role === "viewer") {
    return {
      ok: false,
      code: "WALLET_WRITE_DENIED",
      message: t("actionErrors.transactionWriteForbidden")
    };
  }

  if (params.kind !== "income" && params.kind !== "expense") {
    return {
      ok: false,
      code: "TRANSACTION_KIND_INVALID",
      message: t("actionErrors.transactionCategoryKindMismatch")
    };
  }

  if (!Number.isFinite(params.amount) || params.amount <= 0) {
    return {
      ok: false,
      code: "TRANSACTION_AMOUNT_INVALID",
      message: t("actionErrors.transactionAmountInvalid")
    };
  }

  const rawHappenedAt = (params.happenedAt ?? "").trim();
  const happenedAtDate = rawHappenedAt ? rawHappenedAt.slice(0, 10) : getTodayDateString();
  const happenedAtTime = rawHappenedAt.length > 10 ? rawHappenedAt.slice(11, 16) : null;

  if (!isValidDateString(happenedAtDate)) {
    return {
      ok: false,
      code: "TRANSACTION_DATE_INVALID",
      message: t("actionErrors.transactionDateInvalid")
    };
  }

  const happenedAt = combineDateAndTime(happenedAtDate, happenedAtTime);

  const rateLimit = await consumeTransactionRateLimit(userId);

  if (!rateLimit.allowed) {
    return {
      ok: false,
      code: "TRANSACTION_RATE_LIMITED",
      message: t("actionErrors.transactionRateLimited")
    };
  }

  const walletMap = buildWalletMap(wallets);
  const categories = await getCategoriesForWallets(userId, [params.walletId]);
  let resolvedCategory = categories.find((category) => category.id === (params.categoryId ?? "")) ?? null;

  if (params.categoryId && !resolvedCategory) {
    return {
      ok: false,
      code: "CATEGORY_NOT_FOUND",
      message: t("actionErrors.transactionCategoryNotFound")
    };
  }

  if (resolvedCategory && resolvedCategory.kind !== params.kind) {
    return {
      ok: false,
      code: "CATEGORY_KIND_MISMATCH",
      message: t("actionErrors.transactionCategoryKindMismatch")
    };
  }

  if (!resolvedCategory && params.categoryName) {
    resolvedCategory = await resolveCategoryByName(userId, params.walletId, params.categoryName, params.kind);
  }

  if (!resolvedCategory && params.categoryName) {
    return {
      ok: false,
      code: "CATEGORY_NOT_FOUND",
      message: t("actionErrors.transactionCategoryNotFound")
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      wallet_id: params.walletId,
      category_id: resolvedCategory?.id ?? null,
      kind: params.kind,
      amount: params.amount,
      note: params.note?.trim() || null,
      happened_at: dateStringToISO(happenedAt),
      source: "manual",
      created_by: userId,
      updated_by: userId
    })
    .select("id, wallet_id, category_id, kind, amount, happened_at, note, source")
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: "TRANSACTION_INSERT_FAILED",
      message: mapTransactionError(error?.message ?? "TRANSACTION_INSERT_FAILED", t("actionStatus.linkedSavingTransaction"))
    };
  }

  const dashboardUserIds = await getWalletMemberUserIds(supabase, params.walletId);
  await invalidateWalletReadCaches(params.walletId, {
    targets: ["overview", "transactions", "budgets"],
    dashboardUserIds
  });
  await invalidateAiInsightCache(dashboardUserIds);
  await invalidateAiReadCache(userId);
  await revalidateWalletPaths(params.walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["transactions", "budgets", "reports"]
  });

  return {
    ok: true,
    message: t("actionSuccess.transactionSaved"),
    transaction: {
      id: data.id,
      walletId: data.wallet_id,
      walletName: walletMap.get(data.wallet_id)?.name ?? "Wallet",
      kind: data.kind,
      amount: data.amount,
      happenedAt: data.happened_at,
      categoryId: data.category_id,
      categoryName: resolvedCategory?.name ?? "Tanpa kategori",
      note: data.note,
      source: "manual"
    }
  };
}
