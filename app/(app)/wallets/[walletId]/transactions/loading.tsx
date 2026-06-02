import { FormListLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default function TransactionsLoading() {
  return <FormListLoadingSkeleton currentPath="/wallets/loading-wallet/transactions" title="Transaksi" formFields={5} listCount={4} />;
}
