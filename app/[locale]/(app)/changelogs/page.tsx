import { ChangelogsContent } from "@/components/features/changelogs/changelogs-content";
import { requireUser } from "@/lib/auth";
import { getShellData } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";

export default async function ChangelogsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const { user } = await requireUser();
  const shell = await getShellData(user.id);

  return <ChangelogsContent shell={shell} locale={locale} />;
}
