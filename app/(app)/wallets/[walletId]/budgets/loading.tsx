import { FormListLoadingSkeleton } from "@/components/ui/page-loading-skeleton";

export default function BudgetsLoading() {
  return <FormListLoadingSkeleton currentPath="/wallets/loading-wallet/budgets" title="Anggaran" formFields={3} listCount={4} />;
}
