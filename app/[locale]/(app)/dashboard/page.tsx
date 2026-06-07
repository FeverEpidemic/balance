import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { DashboardContent } from "@/components/features/dashboard/dashboard-content";
import { resolveLocale } from "@/lib/i18n";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { user } = await requireUser();
  const dashboard = await getDashboardData(user.id, locale);

  return <DashboardContent dashboard={dashboard} locale={locale} />;
}
