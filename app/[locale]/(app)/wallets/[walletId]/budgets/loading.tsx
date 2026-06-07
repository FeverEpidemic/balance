import { getActionLocale } from "@/app/actions/_shared";
import { FormListLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { translate } from "@/lib/i18n";

export default async function BudgetsLoading() {
  const locale = await getActionLocale();
  return <FormListLoadingSkeleton currentPath="/wallets/loading-wallet/budgets" title={translate(locale, "common.budgets")} locale={locale} formFields={3} listCount={4} />;
}
