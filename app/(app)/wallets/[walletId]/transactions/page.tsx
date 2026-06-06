import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCurrentMonthKey } from "@/lib/finance";
import { getTransactionsPageData } from "@/lib/data";
import { TransactionsPageContent } from "@/components/features/transactions/transactions-page-content";

export default async function TransactionsPage({
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
  const data = await getTransactionsPageData(user.id, walletId, selectedMonth);

  if (!data) {
    notFound();
  }

  return <TransactionsPageContent data={data} />;
}
