import { getActionLocale } from "@/app/actions/_shared";
import { FormListLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { translate } from "@/lib/i18n";

export default async function RecurringLoading() {
  const locale = await getActionLocale();
  return <FormListLoadingSkeleton currentPath="/wallets/loading-wallet/recurring" title={translate(locale, "common.automatic")} locale={locale} formFields={8} listCount={3} />;
}
