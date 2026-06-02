import { FormListLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default function RecurringLoading() {
  return <FormListLoadingSkeleton currentPath="/wallets/loading-wallet/recurring" title="Transaksi Otomatis" formFields={8} listCount={3} />;
}
