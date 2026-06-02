import { createBudget, deleteBudget, updateBudget } from "@/app/actions/budgets";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import type { BudgetsPageData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export function BudgetsPageContent({
  data,
  feedback
}: {
  data: BudgetsPageData;
  feedback: { error?: string; message?: string };
}) {
  const active = `/wallets/${data.walletId}/budgets`;

  return (
    <AppShell
      currentPath={active}
      title="Anggaran"
      subtitle={`Anggaran bulanan ${data.walletName}`}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <p className="eyebrow">Buat anggaran</p>
          <h3 className="headline-md mt-2">Tetapkan limit bulanan</h3>
          <div className="mt-4 space-y-3">
            {feedback.error ? <Notice tone="error">{feedback.error}</Notice> : null}
            {feedback.message ? <Notice tone="success">{feedback.message}</Notice> : null}
          </div>
          <form action={createBudget} className="mt-6 grid min-w-0 gap-4">
            <input type="hidden" name="wallet_id" value={data.walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Bulan</span>
              <input name="month_start" defaultValue={data.selectedMonth} type="month" required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Kategori</span>
              <select name="category_id" defaultValue={data.categories[0]?.id ?? ""} required>
                {data.categories.map((category) => (
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
            <SubmitButton pendingText="Menyimpan anggaran...">Simpan anggaran</SubmitButton>
          </form>
        </div>
        <div className="card">
          <p className="eyebrow">Pemakaian</p>
          <h3 className="headline-md mt-2">Progress anggaran berjalan</h3>
          <form method="get" className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Filter bulan</span>
              <input name="month" type="month" defaultValue={data.selectedMonth} />
            </label>
            <Button variant="soft" className="w-full sm:w-auto">
              Terapkan
            </Button>
            <Button href={`/wallets/${data.walletId}/budgets`} variant="ghost" className="w-full sm:w-auto">
              Atur ulang
            </Button>
          </form>
          <div className="mt-6 stack-list">
            {data.budgets.length === 0 ? (
              <EmptyState title="Belum ada anggaran aktif" description="Setelah anggaran dibuat, progress kategori akan dihitung dari transaksi pengeluaran pada wallet ini." />
            ) : null}
            {data.budgets.map((budget) => (
              <div key={budget.id} className="list-card">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{budget.categoryName}</p>
                  <p className="metric text-sm">{formatCurrency(budget.amount)}</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white">
                  <div className={`h-2 rounded-full ${budget.ratio > 85 ? "bg-danger" : "bg-primary"}`} style={{ width: `${budget.ratio}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{budget.usageLabel}</p>
                <details className="mt-4 min-w-0 rounded-xl bg-white/80 p-3">
                  <summary className="cursor-pointer font-label text-sm text-muted-foreground">Edit anggaran</summary>
                  <form action={updateBudget} className="mt-3 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,140px)_minmax(0,140px)_auto]">
                    <input type="hidden" name="wallet_id" value={data.walletId} />
                    <input type="hidden" name="budget_id" value={budget.id} />
                    <label className="block">
                      <span className="mb-2 block font-label text-xs text-muted-foreground">Kategori</span>
                      <select name="category_id" defaultValue={budget.categoryId} required>
                        {data.categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-label text-xs text-muted-foreground">Bulan</span>
                      <input name="month_start" type="month" defaultValue={budget.monthStart.slice(0, 7)} required />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-label text-xs text-muted-foreground">Limit</span>
                      <input name="amount" defaultValue={String(budget.amount)} inputMode="numeric" required />
                    </label>
                    <div className="flex min-w-0 items-end gap-2">
                      <SubmitButton className="w-full md:w-auto" pendingText="Menyimpan..." variant="soft">
                        Update
                      </SubmitButton>
                    </div>
                  </form>
                </details>
                <form action={deleteBudget} className="mt-2 w-full sm:w-auto">
                  <input type="hidden" name="wallet_id" value={data.walletId} />
                  <input type="hidden" name="budget_id" value={budget.id} />
                  <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage="Hapus anggaran ini?" pendingText="Menghapus..." variant="ghost">
                    Hapus anggaran
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
