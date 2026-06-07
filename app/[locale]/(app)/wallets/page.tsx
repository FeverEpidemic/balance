import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { WalletsPageContent } from "@/components/features/wallets/wallets-page-content";
import { resolveLocale } from "@/lib/i18n";

export default async function WalletsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const feedback = await searchParams;
  const { user } = await requireUser();
  const dashboard = await getDashboardData(user.id, locale);

  return <WalletsPageContent dashboard={dashboard} feedback={feedback} />;
}
