import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCurrentMonthKey } from "@/lib/finance";
import { getTransactionsPageData, getTransactionHistoryPageData } from "@/lib/data";
import { TransactionsPageContent } from "@/components/features/transactions/transactions-page-content";
import { TransactionHistoryPageContent } from "@/components/features/transactions/transaction-history-page-content";
import type { SortDirection, TransactionHistorySortField } from "@/lib/data";

const historySortFields = new Set<TransactionHistorySortField>(["happened_at", "amount", "category", "kind"]);
const historySortDirections = new Set<SortDirection>(["asc", "desc"]);

function parseHistorySortField(value: string | undefined): TransactionHistorySortField {
  return value && historySortFields.has(value as TransactionHistorySortField) ? (value as TransactionHistorySortField) : "happened_at";
}

function parseHistorySortDirection(value: string | undefined): SortDirection {
  return value && historySortDirections.has(value as SortDirection) ? (value as SortDirection) : "desc";
}

function parsePage(value: string | undefined) {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function TransactionsPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ month?: string; view?: string; q?: string; sort?: string; dir?: string; page?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const selectedMonth = query.month || getCurrentMonthKey();
  const { user } = await requireUser();

  if (query.view === "history") {
    const data = await getTransactionHistoryPageData(user.id, walletId, selectedMonth, undefined, {
      searchQuery: query.q?.trim() ?? "",
      sortBy: parseHistorySortField(query.sort),
      sortDirection: parseHistorySortDirection(query.dir),
      page: parsePage(query.page)
    });
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
