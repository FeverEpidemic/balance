import { getActionLocale } from "@/app/actions/_shared";
import { DetailPageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { translate } from "@/lib/i18n";

export default async function TemplatesLoading() {
  const locale = await getActionLocale();
  return <DetailPageLoadingSkeleton currentPath="/wallets/loading-wallet/templates" title={translate(locale, "common.templates")} locale={locale} />;
}
