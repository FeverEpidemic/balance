"use client";

import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  updateRecurringTransaction
} from "@/app/actions/recurring-transactions";
import { AppShell } from "@/components/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEditPanel } from "@/components/ui/inline-edit-panel";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import type { RecurringTransactionsPageData } from "@/lib/data";
import { formatCurrency, formatShortDate, getTodayDateString } from "@/lib/utils";

function getStatusTone(status: RecurringTransactionsPageData["recurringTransactions"][number]["status"]) {
  if (status === "active") return "success";
  if (status === "ended") return "danger";
  return "default";
}

function RecurringItem({
  canManage,
  categories,
  transaction,
  walletId
}: {
  canManage: boolean;
  categories: RecurringTransactionsPageData["categories"];
  transaction: RecurringTransactionsPageData["recurringTransactions"][number];
  walletId: string;
}) {
  return (
    <div className="rounded-xl bg-muted p-4">
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
            Mulai {formatShortDate(transaction.startDate)}
            {transaction.endDate ? ` sampai ${formatShortDate(transaction.endDate)}` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
            {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Jadwal berikutnya {transaction.nextRunLabel}</p>
        </div>
      </div>
      {transaction.lastGeneratedAt ? (
        <p className="mt-3 text-sm text-muted-foreground">Terakhir dibuat {formatShortDate(transaction.lastGeneratedAt)}</p>
      ) : null}
      {canManage ? (
        <>
          <ActionForm action={updateRecurringTransaction} className="mt-4">
            {({ state }) => (
              <InlineEditPanel
                buttonLabel="Edit aturan"
                closeSignal={state.status === "success" ? state : null}
                description="Perbarui jadwal, nominal, kategori, atau catatan tanpa meninggalkan daftar aturan."
                title="Aturan ini bisa diedit"
              >
                <input type="hidden" name="wallet_id" value={walletId} />
                <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2">
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
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-2 block font-label text-xs text-muted-foreground">Nominal</span>
                    <CurrencyInput name="amount" defaultValue={transaction.amount} required />
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
                  <div className="flex min-w-0 flex-col gap-2 md:col-span-2 sm:flex-row sm:flex-wrap">
                    <SubmitButton className="w-full sm:w-auto" pendingText="Menyimpan..." variant="soft">
                      Update aturan
                    </SubmitButton>
                  </div>
                </div>
              </InlineEditPanel>
            )}
          </ActionForm>
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
            {transaction.status === "active" ? (
              <ActionForm action={pauseRecurringTransaction} className="w-full sm:w-auto">
                <input type="hidden" name="wallet_id" value={walletId} />
                <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                <SubmitButton className="w-full sm:w-auto" pendingText="Menjeda..." variant="ghost">
                  Jeda
                </SubmitButton>
              </ActionForm>
            ) : null}
            {transaction.status === "paused" ? (
              <ActionForm action={resumeRecurringTransaction} className="w-full sm:w-auto">
                <input type="hidden" name="wallet_id" value={walletId} />
                <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
                <SubmitButton className="w-full sm:w-auto" pendingText="Melanjutkan..." variant="soft">
                  Lanjutkan
                </SubmitButton>
              </ActionForm>
            ) : null}
            <ActionForm action={deleteRecurringTransaction} className="w-full sm:w-auto">
              <input type="hidden" name="wallet_id" value={walletId} />
              <input type="hidden" name="recurring_transaction_id" value={transaction.id} />
              <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage="Hapus transaksi otomatis ini?" pendingText="Menghapus..." variant="ghost">
                Hapus
              </ConfirmSubmitButton>
            </ActionForm>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function RecurringPageContent({ data }: { data: RecurringTransactionsPageData }) {
  const active = `/wallets/${data.walletId}/recurring`;
  const canManage = data.currentUserRole === "owner" || data.currentUserRole === "editor";

  return (
    <AppShell
      currentPath={active}
      title="Transaksi Otomatis"
      subtitle={`Atur transaksi otomatis untuk ${data.walletName}`}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card">
          <p className="eyebrow">Aturan baru</p>
          <h3 className="headline-md mt-2">Pemasukan atau pengeluaran otomatis</h3>
          <div className="mt-4 space-y-3">
            {!canManage ? <Notice>Peran viewer hanya dapat melihat transaksi otomatis tanpa mengubah data.</Notice> : null}
          </div>
          {canManage ? (
            <ActionForm action={createRecurringTransaction} className="mt-6 grid min-w-0 gap-4" resetOnSuccess>
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
              <SubmitButton pendingText="Menyimpan aturan...">Simpan aturan</SubmitButton>
            </ActionForm>
          ) : null}
        </div>

        <div className="card">
          <p className="eyebrow">Aturan aktif</p>
          <h3 className="headline-md mt-2">Daftar transaksi otomatis</h3>
          <div className="mt-6 space-y-4">
            {data.recurringTransactions.length === 0 ? (
              <EmptyState title="Belum ada transaksi otomatis" description="Setelah dibuat, scheduler akan menghasilkan transaksi baru sesuai jadwal yang ditentukan." />
            ) : null}
            {data.recurringTransactions.map((transaction) => (
              <RecurringItem
                key={transaction.id}
                canManage={canManage}
                categories={data.categories}
                transaction={transaction}
                walletId={data.walletId}
              />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
