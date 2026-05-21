import { notFound } from "next/navigation";
import { createBudget } from "@/app/actions/budgets";
import { getCurrentMonthKey, describeBudgetUsage } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { WalletTabs } from "@/components/wallet-tabs";
import { formatCurrency } from "@/lib/utils";

export default async function BudgetsPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const active = `/wallets/${walletId}/budgets`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  const monthKey = getCurrentMonthKey();
  const categories = bundle.categories.filter((category) => category.kind === "expense");

  return (
    <AppShell
      currentPath={active}
      title="Budget"
      subtitle={`Budget bulanan ${bundle.wallet.name}`}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <WalletTabs walletId={walletId} active={active} />
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <p className="eyebrow">Buat budget</p>
          <h3 className="headline-md mt-2">Tetapkan limit bulanan</h3>
          <div className="mt-4 space-y-3">
            {query.error ? <Notice tone="error">{query.error}</Notice> : null}
            {query.message ? <Notice tone="success">{query.message}</Notice> : null}
          </div>
          <form action={createBudget} className="mt-6 grid gap-4">
            <input type="hidden" name="wallet_id" value={walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Bulan</span>
              <input name="month_start" defaultValue={monthKey} type="month" required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Kategori</span>
              <select name="category_id" defaultValue={categories[0]?.id ?? ""} required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Limit</span>
              <input name="amount" defaultValue="2500000" inputMode="numeric" required />
            </label>
            <SubmitButton pendingText="Menyimpan budget...">Simpan budget</SubmitButton>
          </form>
        </div>
        <div className="card">
          <p className="eyebrow">Pemakaian</p>
          <h3 className="headline-md mt-2">Progress budget berjalan</h3>
          <div className="mt-6 space-y-4">
            {bundle.budgets.length === 0 ? <EmptyState title="Belum ada budget aktif" description="Setelah budget dibuat, progress kategori akan dihitung dari transaksi expense pada wallet ini." /> : null}
            {bundle.budgets.map((row) => {
              const category = bundle.categories.find((item) => item.id === row.category_id);
              const used = bundle.transactions
                .filter((transaction) => transaction.kind === "expense" && transaction.category_id === row.category_id && transaction.happened_at.startsWith(row.month_start.slice(0, 7)))
                .reduce((total, transaction) => total + transaction.amount, 0);
              const ratio = Math.min((used / row.amount) * 100, 100);
              return (
                <div key={row.id} className="rounded-xl bg-muted p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{category?.name ?? "Kategori"}</p>
                    <p className="metric text-sm">{formatCurrency(row.amount)}</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div className={`h-2 rounded-full ${ratio > 85 ? "bg-danger" : "bg-primary"}`} style={{ width: `${ratio}%` }} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{describeBudgetUsage(used, row.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
