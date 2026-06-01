import { createTransaction, deleteTransaction, updateTransaction } from "@/app/actions/transactions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { WalletTabs } from "@/components/wallet-tabs";
import type { TransactionsPageData } from "@/lib/data";
import { formatCurrency, formatShortDate, getTodayDateString, toDateInputValue } from "@/lib/utils";

export function TransactionsPageContent({
  data,
  feedback
}: {
  data: TransactionsPageData;
  feedback: { error?: string; message?: string };
}) {
  const active = `/wallets/${data.walletId}/transactions`;
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";

  return (
    <AppShell
      currentPath={active}
      title="Transaksi"
      subtitle={`Input transaksi untuk ${data.walletName}`}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <WalletTabs walletId={data.walletId} active={active} />
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card">
          <p className="eyebrow">Quick entry</p>
          <h3 className="headline-md mt-2">Tambah expense atau income</h3>
          <div className="mt-4 space-y-3">
            {feedback.error ? <Notice tone="error">{feedback.error}</Notice> : null}
            {feedback.message ? <Notice tone="success">{feedback.message}</Notice> : null}
          </div>
          <form action={createTransaction} className="mt-6 grid gap-4">
            <input type="hidden" name="wallet_id" value={data.walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Jenis transaksi</span>
              <select name="kind" defaultValue="expense">
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Nominal</span>
              <input name="amount" placeholder="Rp0" inputMode="numeric" required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Kategori</span>
              <select name="category_id" required defaultValue={data.categories[0]?.id ?? ""}>
                {data.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Catatan</span>
              <input name="note" placeholder="Belanja bulanan supermarket" />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Tanggal transaksi</span>
              <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
            </label>
            <SubmitButton pendingText="Menyimpan transaksi...">Simpan transaksi</SubmitButton>
          </form>
        </div>

        <div className="card">
          <p className="eyebrow">Riwayat</p>
          <h3 className="headline-md mt-2">Transaksi terakhir</h3>
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Filter bulan</span>
              <input name="month" type="month" defaultValue={data.selectedMonth} />
            </label>
            <Button variant="soft">Terapkan</Button>
            <Button href={`/wallets/${data.walletId}/transactions`} variant="ghost">
              Reset
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            {data.transactions.length === 0 ? (
              <EmptyState title="Belum ada transaksi" description="Transaksi yang Anda simpan akan muncul di sini secara realtime dari database." />
            ) : null}
            {data.transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-xl bg-muted p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{transaction.title}</p>
                      {transaction.isRecurring ? <Badge>Recurring</Badge> : null}
                      {transaction.isSavingLinked ? <Badge>Saving</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {transaction.categoryName} - {transaction.splitLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
                      {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(transaction.happenedAt)}</p>
                  </div>
                </div>
                {transaction.isSavingLinked ? (
                  <div className="mt-4 rounded-xl bg-white/80 p-3 text-sm text-muted-foreground">
                    Transaksi ini dibuat otomatis dari tab Saving dan tidak bisa diedit atau dihapus dari sini.
                  </div>
                ) : canMutate ? (
                  <>
                    <details className="mt-4 rounded-xl bg-white/80 p-3">
                      <summary className="cursor-pointer font-label text-sm text-muted-foreground">Edit transaksi</summary>
                      <form action={updateTransaction} className="mt-3 grid gap-3 md:grid-cols-2">
                        <input type="hidden" name="wallet_id" value={data.walletId} />
                        <input type="hidden" name="transaction_id" value={transaction.id} />
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Jenis</span>
                          <select name="kind" defaultValue={transaction.kind}>
                            <option value="expense">Pengeluaran</option>
                            <option value="income">Pemasukan</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Kategori</span>
                          <select name="category_id" defaultValue={transaction.categoryId ?? ""}>
                            <option value="">Tanpa kategori</option>
                            {data.categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Nominal</span>
                          <input name="amount" defaultValue={String(transaction.amount)} inputMode="numeric" required />
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Catatan</span>
                          <input name="note" defaultValue={transaction.note ?? ""} placeholder="Opsional" />
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Tanggal transaksi</span>
                          <input name="happened_at" type="date" defaultValue={toDateInputValue(transaction.happenedAt)} required />
                        </label>
                        <div className="flex flex-wrap gap-2 md:col-span-2">
                          <SubmitButton pendingText="Menyimpan..." variant="soft">
                            Update transaksi
                          </SubmitButton>
                        </div>
                      </form>
                    </details>
                    <form action={deleteTransaction} className="mt-2">
                      <input type="hidden" name="wallet_id" value={data.walletId} />
                      <input type="hidden" name="transaction_id" value={transaction.id} />
                      <ConfirmSubmitButton confirmMessage="Hapus transaksi ini?" pendingText="Menghapus..." variant="ghost">
                        Hapus transaksi
                      </ConfirmSubmitButton>
                    </form>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
