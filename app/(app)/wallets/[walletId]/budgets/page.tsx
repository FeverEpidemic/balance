import { notFound } from "next/navigation";
import { getCurrentMonthKey } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getBudgetsPageData } from "@/lib/data";
import { BudgetsPageContent } from "@/components/features/budgets/budgets-page-content";

export default async function BudgetsPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string; month?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const selectedMonth = query.month || getCurrentMonthKey();
  const { user } = await requireUser();
  const data = await getBudgetsPageData(user.id, walletId, selectedMonth);

  if (!data) {
    notFound();
  }

  return <BudgetsPageContent data={data} feedback={query} />;
}
