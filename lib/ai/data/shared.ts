import "server-only";
import { queryCurrentUserWalletIds, queryWallets } from "@/lib/data/queries";
import type { CategoryRow, WalletRow } from "@/lib/data/types";
import type { AiWalletOption } from "@/lib/ai/data/types";

export async function getAccessibleWallets(userId: string) {
  const memberships = await queryCurrentUserWalletIds(userId);
  const walletIds = memberships.map((item) => item.wallet_id);
  const wallets = await queryWallets(walletIds);

  return {
    memberships,
    walletIds,
    wallets
  };
}

export function assertAccessibleWallet(walletIds: string[], walletId: string | null | undefined) {
  if (walletId && !walletIds.includes(walletId)) {
    throw new Error("WALLET_ACCESS_DENIED");
  }
}

/**
 * UUID v4 regex pattern for checking if a string is a valid UUID.
 */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a wallet ID that may be a UUID or a human-readable name.
 * If the input is already a valid UUID, return it as-is.
 * Otherwise, try to match it against the user's accessible wallets by name (case-insensitive, normalized).
 * Returns the matched UUID, or the original input if no match is found.
 */
export async function resolveWalletIdByName(userId: string, walletId: string): Promise<string> {
  if (UUID_PATTERN.test(walletId)) {
    return walletId;
  }

  const { wallets } = await getAccessibleWallets(userId);
  const normalizedInput = normalizeForMatch(walletId);

  // Try exact match first, then partial match
  const exactMatch = wallets.find((w) => normalizeForMatch(w.name) === normalizedInput);
  if (exactMatch) {
    return exactMatch.id;
  }

  // Fall back to partial match
  const partialMatch = wallets.find((w) => {
    const normalizedName = normalizeForMatch(w.name);
    return normalizedName.includes(normalizedInput) || normalizedInput.includes(normalizedName);
  });

  return partialMatch?.id ?? walletId;
}

export function buildCategoryMap(categories: CategoryRow[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

export function buildWalletMap(wallets: WalletRow[]) {
  return new Map(wallets.map((wallet) => [wallet.id, wallet]));
}

export function normalizeForMatch(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getAiWalletOptions(userId: string): Promise<AiWalletOption[]> {
  const { wallets } = await getAccessibleWallets(userId);

  return wallets.map((wallet) => ({
    id: wallet.id,
    name: wallet.name,
    kind: wallet.kind,
    salaryCycleDay: wallet.salary_cycle_day ?? 1
  }));
}
