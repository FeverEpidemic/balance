import "server-only";
import { queryCategories, queryWallets } from "@/lib/data/queries";
import type { TransactionKind } from "@/lib/data/types";
import type { AiCategoryOption } from "@/lib/ai/data/types";
import {
  getAccessibleWallets,
  assertAccessibleWallet,
  buildWalletMap,
  normalizeForMatch
} from "@/lib/ai/data/shared";

export async function getCategoriesForWallets(userId: string, walletIds?: string[] | null): Promise<AiCategoryOption[]> {
  const access = await getAccessibleWallets(userId);
  const requestedWalletIds = walletIds?.filter(Boolean) ?? [];

  requestedWalletIds.forEach((walletId) => assertAccessibleWallet(access.walletIds, walletId));

  const targetWalletIds = requestedWalletIds.length > 0 ? requestedWalletIds : access.walletIds;
  const [wallets, categories] = await Promise.all([
    targetWalletIds.length === access.walletIds.length ? access.wallets : queryWallets(targetWalletIds),
    queryCategories(targetWalletIds)
  ]);
  const walletMap = buildWalletMap(wallets);

  return categories.map((category) => ({
    id: category.id,
    walletId: category.wallet_id,
    walletName: walletMap.get(category.wallet_id)?.name ?? "Wallet",
    name: category.name,
    kind: category.kind,
    color: category.color,
    isSystem: category.is_system
  }));
}

export async function resolveCategoryByName(
  userId: string,
  walletId: string,
  categoryName: string,
  kind: TransactionKind
): Promise<AiCategoryOption | null> {
  const normalizedCategoryName = normalizeForMatch(categoryName);

  if (!normalizedCategoryName) {
    return null;
  }

  const categories = await getCategoriesForWallets(userId, [walletId]);
  const matchingCategories = categories
    .filter((category) => category.kind === kind)
    .sort((a, b) => b.name.length - a.name.length);

  const exactMatch = matchingCategories.find((category) => normalizeForMatch(category.name) === normalizedCategoryName);

  if (exactMatch) {
    return exactMatch;
  }

  return (
    matchingCategories.find((category) => {
      const normalizedExisting = normalizeForMatch(category.name);
      return normalizedExisting.includes(normalizedCategoryName) || normalizedCategoryName.includes(normalizedExisting);
    }) ?? null
  );
}
