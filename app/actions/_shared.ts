import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export * from "@/app/actions/action-result";
import { parseNumberInput } from "@/lib/finance";

export type MessageType = "error" | "message";
export type WalletSection = "transactions" | "budgets" | "members" | "settlements" | "templates" | "reports" | "recurring" | "savings";

export function withMessage(path: string, type: MessageType, message: string) {
  return `${path}?${new URLSearchParams({ [type]: message }).toString()}`;
}

export function walletSectionPath(walletId: string, section?: WalletSection) {
  return section ? `/wallets/${walletId}/${section}` : `/wallets/${walletId}`;
}

export function redirectWithMessage(path: string, type: MessageType, message: string): never {
  redirect(withMessage(path, type, message));
}

export function redirectToWalletSection(walletId: string, section: WalletSection, type: MessageType, message: string): never {
  redirectWithMessage(walletSectionPath(walletId, section), type, message);
}

export function revalidateWalletPaths(
  walletId: string,
  options: {
    includeDashboard?: boolean;
    includeOverview?: boolean;
    sections?: WalletSection[];
  } = {}
) {
  const { includeDashboard = false, includeOverview = true, sections = [] } = options;

  if (includeDashboard) {
    revalidatePath("/dashboard");
  }

  if (includeOverview) {
    revalidatePath(walletSectionPath(walletId));
  }

  sections.forEach((section) => {
    revalidatePath(walletSectionPath(walletId, section));
  });
}

export function getStringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export function getTrimmedValue(formData: FormData, key: string) {
  return getStringValue(formData, key).trim();
}

export function getNullableText(formData: FormData, key: string) {
  const value = getTrimmedValue(formData, key);
  return value || null;
}

export function getNumericValue(formData: FormData, key: string) {
  return parseNumberInput(formData.get(key));
}
