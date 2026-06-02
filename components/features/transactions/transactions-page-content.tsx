import { createBalanceAdjustment, createTransaction, deleteTransaction, updateTransaction } from "@/app/actions/transactions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEditPanel } from "@/components/ui/inline-edit-panel";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
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
      <ToastFeedback error={feedback.error} message={feedback.message} />
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card">
          <p className="eyebrow">Input cepat</p>
          <h3 className="headline-md mt-2">Tambah pemasukan atau pengeluaran</h3>
          <form action={createTransaction} className="mt-6 grid min-w-0 gap-4">
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
              <CurrencyInput name="amount" placeholder="Rp0" required />
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

          {canMutate ? (
            <div className="mt-8 border-t border-black/5 pt-6">
              <p className="eyebrow">Penyesuaian saldo</p>
              <h3 className="headline-md mt-2">Sinkronkan saldo aktual wallet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Gunakan saat ada selisih antara saldo aktual dengan catatan di aplikasi. Penyesuaian ini tetap masuk ke histori transaksi.
              </p>
              <form action={createBalanceAdjustment} className="mt-6 grid min-w-0 gap-4">
                <input type="hidden" name="wallet_id" value={data.walletId} />
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">Arah penyesuaian</span>
                  <select name="direction" defaultValue="increase">
                    <option value="increase">Naikkan saldo</option>
                    <option value="decrease">Turunkan saldo</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">Nominal penyesuaian</span>
                  <CurrencyInput name="amount" placeholder="Rp0" required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">Alasan penyesuaian</span>
                  <input name="note" placeholder="Contoh: saldo awal dompet fisik, koreksi kas, selisih pencatatan" required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-sm text-muted-foreground">Tanggal penyesuaian</span>
                  <input name="happened_at" type="date" defaultValue={getTodayDateString()} required />
                </label>
                <SubmitButton pendingText="Menyimpan penyesuaian...">Simpan penyesuaian saldo</SubmitButton>
              </form>
            </div>
          ) : null}
        </div>

        <div className="card">
          <p className="eyebrow">Riwayat</p>
          <h3 className="headline-md mt-2">Transaksi terakhir</h3>
          <form method="get" className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Filter bulan</span>
              <input name="month" type="month" defaultValue={data.selectedMonth} />
            </label>
            <Button variant="soft" className="w-full sm:w-auto">
              Terapkan
            </Button>
            <Button href={`/wallets/${data.walletId}/transactions`} variant="ghost" className="w-full sm:w-auto">
              Atur ulang
            </Button>
          </form>
          <div className="mt-6 stack-list">
            {data.transactions.length === 0 ? (
              <EmptyState title="Belum ada transaksi" description="Transaksi yang kamu simpan akan muncul di sini langsung dari database." />
            ) : null}
            {data.transactions.map((transaction) => (
              <div key={transaction.id} className="list-card">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{transaction.title}</p>
                      {transaction.isRecurring ? <Badge>Otomatis</Badge> : null}
                      {transaction.isSavingLinked ? <Badge>Tabungan</Badge> : null}
                      {transaction.isBalanceAdjustment ? <Badge>Penyesuaian</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{transaction.categoryName} • {transaction.splitLabel}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
                      {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(transaction.happenedAt)}</p>
                  </div>
                </div>
                {transaction.isSavingLinked ? (
                  <div className="mt-4 rounded-xl bg-white/80 p-3 text-sm text-muted-foreground">
                    Transaksi ini dibuat otomatis dari tab Tabungan dan tidak bisa diedit atau dihapus dari sini.
                  </div>
                ) : canMutate ? (
                  <>
                    <InlineEditPanel
                      buttonLabel="Ubah transaksi"
                      description="Perbarui kategori, nominal, catatan, atau tanggal langsung dari kartu transaksi ini."
                      title="Transaksi ini bisa diedit"
                    >
                      <form action={updateTransaction} className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
                        <input type="hidden" name="wallet_id" value={data.walletId} />
                        <input type="hidden" name="transaction_id" value={transaction.id} />
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Jenis</span>
                          <select name="kind" defaultValue={transaction.kind}>
                            <option value="expense">Pengeluaran</option>
                            <option value="income">Pemasukan</option>
                          </select>
                        </label>
                        {transaction.isBalanceAdjustment ? (
                          <div className="rounded-xl bg-white/80 p-3 text-sm text-muted-foreground">
                            Kategori penyesuaian saldo dikelola otomatis oleh sistem mengikuti arah pemasukan atau pengeluaran.
                          </div>
                        ) : (
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
                        )}
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Nominal</span>
                          <CurrencyInput name="amount" defaultValue={transaction.amount} required />
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Catatan</span>
                          <input name="note" defaultValue={transaction.note ?? ""} placeholder="Opsional" />
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Tanggal transaksi</span>
                          <input name="happened_at" type="date" defaultValue={toDateInputValue(transaction.happenedAt)} required />
                        </label>
                        <div className="flex min-w-0 flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap">
                          <SubmitButton className="w-full sm:w-auto" pendingText="Menyimpan..." variant="soft">
                            Update transaksi
                          </SubmitButton>
                        </div>
                      </form>
                    </InlineEditPanel>
                    <form action={deleteTransaction} className="mt-2 w-full sm:w-auto">
                      <input type="hidden" name="wallet_id" value={data.walletId} />
                      <input type="hidden" name="transaction_id" value={transaction.id} />
                      <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage="Hapus transaksi ini?" pendingText="Menghapus..." variant="ghost">
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
