import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  updateRecurringTransaction
} from "@/app/actions/recurring-transactions";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { WalletTabs } from "@/components/wallet-tabs";
import type { RecurringTransactionsPageData } from "@/lib/data";
import { formatCurrency, formatShortDate, getTodayDateString } from "@/lib/utils";

function getStatusTone(status: RecurringTransactionsPageData["recurringTransactions"][number]["status"]) {
  if (status === "active") return "success";
  if (status === "ended") return "danger";
  return "default";
}

export function RecurringPageContent({
  data,
  feedback
}: {
  data: RecurringTransactionsPageData;
  feedback: { error?: string; message?: string };
}) {
  const active = `/wallets/${data.walletId}/recurring`;
  const canManage = data.currentUserRole === "owner" || data.currentUserRole === "editor";

  return (
    <AppShell
      currentPath={active}
      title="Recurring"
      subtitle={`Atur transaksi otomatis untuk ${data.walletName}`}
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
          <p className="eyebrow">Buat recurring</p>
          <h3 className="headline-md mt-2">Income atau expense otomatis</h3>
          <div className="mt-4 space-y-3">
            {feedback.error ? <Notice tone="error">{feedback.error}</Notice> : null}
            {feedback.message ? <Notice tone="success">{feedback.message}</Notice> : null}
            {!canManage ? <Notice>Role viewer hanya dapat melihat recurring transaction tanpa mengubah data.</Notice> : null}
          </div>
          {canManage ? (
            <form action={createRecurringTransaction} className="mt-6 grid gap-4">
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
                <select name="category_id" defaultValue="">
                  <option value="">Tanpa kategori</option>
                  {data.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Catatan</span>
                <input name="note" placeholder="Contoh: Gaji bulanan" />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Frekuensi</span>
                <select name="frequency" defaultValue="monthly">
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Interval</span>
                <input name="interval_count" type="number" defaultValue="1" min="1" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Tanggal mulai</span>
                <input name="start_date" type="date" defaultValue={getTodayDateString()} required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Tanggal akhir</span>
                <input name="end_date" type="date" />
              </label>
              <SubmitButton pendingText="Menyimpan recurring...">Simpan recurring</SubmitButton>
            </form>
          ) : null}
        </div>

        <div className="card">
          <p className="eyebrow">Rule aktif</p>
          <h3 className="headline-md mt-2">Daftar recurring transaction</h3>
          <div className="mt-6 space-y-4">
            {data.recurringTransactions.length === 0 ? (
              <EmptyState title="Belum ada recurring transaction" description="Setelah dibuat, scheduler akan menghasilkan transaksi baru otomatis sesuai jadwal yang ditentukan." />
            ) : null}
            {data.recurringTransactions.map((transaction) => (
              <div key={transaction.id} className="rounded-xl bg-muted p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{transaction.note || (transaction.kind === "income" ? "Pemasukan otomatis" : "Pengeluaran otomatis")}</p>
                      <Badge tone={getStatusTone(transaction.status)}>{transaction.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {transaction.categoryName} - {transaction.frequencyLabel}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Mulai {formatShortDate(transaction.startDate)}{transaction.endDate ? ` sampai ${formatShortDate(transaction.endDate)}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
                      {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Next run {transaction.nextRunLabel}</p>
                  </div>
                </div>
                {transaction.lastGeneratedAt ? (
                  <p className="mt-3 text-sm text-muted-foreground">Terakhir generate {formatShortDate(transaction.lastGeneratedAt)}</p>
                ) : null}
                {canManage ? (
                  <>
                    <details className="mt-4 rounded-xl bg-white/80 p-3">
                      <summary className="cursor-pointer font-label text-sm text-muted-foreground">Edit recurring</summary>
                      <form action={updateRecurringTransaction} className="mt-3 grid gap-3 md:grid-cols-2">
                        <input type="hidden" name="wallet_id" value={data.walletId} />
                        <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
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
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Frekuensi</span>
                          <select name="frequency" defaultValue={transaction.frequency}>
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Interval</span>
                          <input name="interval_count" type="number" min="1" defaultValue={String(transaction.intervalCount)} required />
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Tanggal mulai</span>
                          <input name="start_date" type="date" defaultValue={transaction.startDate} required />
                        </label>
                        <label className="block">
                          <span className="mb-2 block font-label text-xs text-muted-foreground">Tanggal akhir</span>
                          <input name="end_date" type="date" defaultValue={transaction.endDate ?? ""} />
                        </label>
                        <div className="flex flex-wrap gap-2 md:col-span-2">
                          <SubmitButton pendingText="Menyimpan..." variant="soft">
                            Update recurring
                          </SubmitButton>
                        </div>
                      </form>
                    </details>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {transaction.status === "active" ? (
                        <form action={pauseRecurringTransaction}>
                          <input type="hidden" name="wallet_id" value={data.walletId} />
                          <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                          <SubmitButton pendingText="Menjeda..." variant="ghost">
                            Pause
                          </SubmitButton>
                        </form>
                      ) : null}
                      {transaction.status === "paused" ? (
                        <form action={resumeRecurringTransaction}>
                          <input type="hidden" name="wallet_id" value={data.walletId} />
                          <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                          <SubmitButton pendingText="Melanjutkan..." variant="soft">
                            Resume
                          </SubmitButton>
                        </form>
                      ) : null}
                      <form action={deleteRecurringTransaction}>
                        <input type="hidden" name="wallet_id" value={data.walletId} />
                        <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                        <ConfirmSubmitButton confirmMessage="Hapus recurring transaction ini?" pendingText="Menghapus..." variant="ghost">
                          Delete
                        </ConfirmSubmitButton>
                      </form>
                    </div>
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
