import { getActionLocale } from "@/app/actions/_shared";
import { FormListLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { translate } from "@/lib/i18n";

export default async function TransactionsLoading() {
  const locale = await getActionLocale();
  return <FormListLoadingSkeleton currentPath="/wallets/loading-wallet/transactions" title={translate(locale, "common.transactions")} locale={locale} formFields={5} listCount={4} />;
}
