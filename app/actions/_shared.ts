import "server-only";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export * from "@/app/actions/action-result";
import { parseNumberInput } from "@/lib/finance";
import { defaultLocale, getTranslator, LOCALE_COOKIE_NAME, localizePath, resolveLocale, type AppLocale } from "@/lib/i18n";
import { requireUser } from "@/lib/auth";

export type MessageType = "error" | "message";
export type WalletSection = "transactions" | "budgets" | "members" | "settlements" | "templates" | "reports" | "recurring" | "savings";

export async function getActionLocale(): Promise<AppLocale> {
  try {
    const cookieStore = await cookies();
    return resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? defaultLocale);
  } catch {
    return defaultLocale;
  }
}

export function withMessage(path: string, type: MessageType, message: string) {
  return `${path}?${new URLSearchParams({ [type]: message }).toString()}`;
}

export async function getLocalizedPath(path: string) {
  const locale = await getActionLocale();
  return localizePath(locale, path);
}

export async function getActionTranslator() {
  return getTranslator(await getActionLocale());
}

export async function walletSectionPath(walletId: string, section?: WalletSection) {
  return getLocalizedPath(section ? `/wallets/${walletId}/${section}` : `/wallets/${walletId}`);
}

export async function redirectWithMessage(path: string, type: MessageType, message: string): Promise<never> {
  const localizedPath = await getLocalizedPath(path);
  redirect(withMessage(localizedPath, type, message));
}

export async function redirectToWalletSection(walletId: string, section: WalletSection, type: MessageType, message: string): Promise<never> {
  const path = await walletSectionPath(walletId, section);
  redirect(withMessage(path, type, message));
}

export async function revalidateWalletPaths(
  walletId: string,
  options: {
    includeDashboard?: boolean;
    includeOverview?: boolean;
    sections?: WalletSection[];
  } = {}
) {
  const { includeDashboard = false, includeOverview = true, sections = [] } = options;
  const locale = await getActionLocale();

  if (includeDashboard) {
    revalidatePath(localizePath(locale, "/dashboard"));
  }

  if (includeOverview) {
    revalidatePath(localizePath(locale, `/wallets/${walletId}`));
  }

  sections.forEach((section) => {
    revalidatePath(localizePath(locale, `/wallets/${walletId}/${section}`));
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

export async function getWalletMemberUserIds(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string
) {
  const { data, error } = await supabase.from("wallet_members").select("user_id").eq("wallet_id", walletId);

  if (error || !data) {
    return [];
  }

  return [...new Set(data.map((row) => row.user_id))];
}
