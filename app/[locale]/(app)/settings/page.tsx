import { requireUser } from "@/lib/auth";
import { getSettingsData } from "@/lib/data";
import { SettingsPageContent } from "@/components/features/settings/settings-page-content";
import { resolveLocale } from "@/lib/i18n";

export default async function SettingsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { user } = await requireUser();
  const settings = await getSettingsData(user.id);

  return <SettingsPageContent settings={settings} locale={locale} />;
}
