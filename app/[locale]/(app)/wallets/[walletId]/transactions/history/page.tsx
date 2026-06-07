import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCurrentMonthKey } from "@/lib/finance";
import { getTransactionHistoryPageData } from "@/lib/data";
import { TransactionHistoryPageContent } from "@/components/features/transactions/transaction-history-page-content";

export default async function TransactionHistoryPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const selectedMonth = query.month || getCurrentMonthKey();
  const { user } = await requireUser();
  const data = await getTransactionHistoryPageData(user.id, walletId, selectedMonth);

  if (!data) {
    notFound();
  }

  return <TransactionHistoryPageContent data={data} />;
}
