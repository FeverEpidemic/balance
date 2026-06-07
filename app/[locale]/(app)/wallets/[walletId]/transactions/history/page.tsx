import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCurrentMonthKey } from "@/lib/finance";
import { getTransactionHistoryPageData } from "@/lib/data";
import { TransactionHistoryPageContent } from "@/components/features/transactions/transaction-history-page-content";
import { resolveLocale } from "@/lib/i18n";

export default async function TransactionHistoryPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; walletId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale: localeParam, walletId } = await params;
  const locale = resolveLocale(localeParam);
  const query = await searchParams;
  const selectedMonth = query.month || getCurrentMonthKey();
  const { user } = await requireUser();
  const data = await getTransactionHistoryPageData(user.id, walletId, selectedMonth, locale);

  if (!data) {
    notFound();
  }

  return <TransactionHistoryPageContent data={data} />;
}
