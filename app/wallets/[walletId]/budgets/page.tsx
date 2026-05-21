import { notFound } from "next/navigation";
import { createBudget, deleteBudget, updateBudget } from "@/app/actions/budgets";
import { getCurrentMonthKey, describeBudgetUsage } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
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
  searchParams: Promise<{ error?: string; message?: string; month?: string }>;
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
  const selectedMonth = query.month || monthKey;
  const categories = bundle.categories.filter((category) => category.kind === "expense");
  const filteredBudgets = bundle.budgets.filter((row) => row.month_start.startsWith(selectedMonth));

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
              <input name="month_start" defaultValue={selectedMonth} type="month" required />
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
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Filter bulan</span>
              <input name="month" type="month" defaultValue={selectedMonth} />
            </label>
            <Button variant="soft">Terapkan</Button>
            <Button href={`/wallets/${walletId}/budgets`} variant="ghost">
              Reset
            </Button>
          </form>
          <div className="mt-6 space-y-4">
            {filteredBudgets.length === 0 ? <EmptyState title="Belum ada budget aktif" description="Setelah budget dibuat, progress kategori akan dihitung dari transaksi expense pada wallet ini." /> : null}
            {filteredBudgets.map((row) => {
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
                  <details className="mt-4 rounded-xl bg-white/80 p-3">
                    <summary className="cursor-pointer font-label text-sm text-muted-foreground">Edit budget</summary>
                    <form action={updateBudget} className="mt-3 grid gap-3 md:grid-cols-[1fr_140px_140px_auto]">
                      <input type="hidden" name="wallet_id" value={walletId} />
                      <input type="hidden" name="budget_id" value={row.id} />
                      <label className="block">
                        <span className="mb-2 block font-label text-xs text-muted-foreground">Kategori</span>
                        <select name="category_id" defaultValue={row.category_id} required>
                          {categories.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-2 block font-label text-xs text-muted-foreground">Bulan</span>
                        <input name="month_start" type="month" defaultValue={row.month_start.slice(0, 7)} required />
                      </label>
                      <label className="block">
                        <span className="mb-2 block font-label text-xs text-muted-foreground">Limit</span>
                        <input name="amount" defaultValue={String(row.amount)} inputMode="numeric" required />
                      </label>
                      <div className="flex items-end gap-2">
                        <SubmitButton className="w-full md:w-auto" pendingText="Menyimpan..." variant="soft">
                          Update
                        </SubmitButton>
                      </div>
                    </form>
                  </details>
                  <form action={deleteBudget} className="mt-2">
                    <input type="hidden" name="wallet_id" value={walletId} />
                    <input type="hidden" name="budget_id" value={row.id} />
                    <ConfirmSubmitButton confirmMessage="Hapus budget ini?" pendingText="Menghapus..." variant="ghost">
                      Hapus budget
                    </ConfirmSubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
