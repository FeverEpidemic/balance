import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCurrentMonthKey } from "@/lib/finance";
import { getTransactionsPageData, getTransactionHistoryPageData } from "@/lib/data";
import { TransactionsPageContent } from "@/components/features/transactions/transactions-page-content";
import { TransactionHistoryPageContent } from "@/components/features/transactions/transaction-history-page-content";

export default async function TransactionsPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ month?: string; view?: string; cursor?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const selectedMonth = query.month || getCurrentMonthKey();
  const { user } = await requireUser();

  if (query.view === "history") {
    const data = await getTransactionHistoryPageData(user.id, walletId, selectedMonth, undefined, query.cursor);
    if (!data) {
      return redirect("/dashboard");
    }
    return <TransactionHistoryPageContent data={data} />;
  }

  const data = await getTransactionsPageData(user.id, walletId, selectedMonth);

  if (!data) {
    notFound();
  }

  return <TransactionsPageContent data={data} />;
}
