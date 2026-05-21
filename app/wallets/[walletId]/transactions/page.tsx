import { notFound } from "next/navigation";
import { createTransaction, deleteTransaction, updateTransaction } from "@/app/actions/transactions";
import { requireUser } from "@/lib/auth";
import { getCurrentMonthKey } from "@/lib/finance";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { WalletTabs } from "@/components/wallet-tabs";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export default async function TransactionsPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string; month?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const active = `/wallets/${walletId}/transactions`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  const categories = bundle.categories.filter((category) => category.kind === "expense" || category.kind === "income");
  const selectedMonth = query.month || getCurrentMonthKey();
  const filteredTransactions = bundle.transactions.filter((transaction) => transaction.happened_at.startsWith(selectedMonth));

  return (
    <AppShell
      currentPath={active}
      title="Transaksi"
      subtitle={`Input transaksi untuk ${bundle.wallet.name}`}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <WalletTabs walletId={walletId} active={active} />
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card">
          <p className="eyebrow">Quick entry</p>
          <h3 className="headline-md mt-2">Tambah expense atau income</h3>
          <div className="mt-4 space-y-3">
            {query.error ? <Notice tone="error">{query.error}</Notice> : null}
            {query.message ? <Notice tone="success">{query.message}</Notice> : null}
          </div>
          <form action={createTransaction} className="mt-6 grid gap-4">
            <input type="hidden" name="wallet_id" value={walletId} />
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
              <select name="category_id" required defaultValue={categories[0]?.id ?? ""}>
                {categories.map((category) => (
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
            <SubmitButton pendingText="Menyimpan transaksi...">Simpan transaksi</SubmitButton>
          </form>
        </div>

        <div className="card">
          <p className="eyebrow">Riwayat</p>
          <h3 className="headline-md mt-2">Transaksi terakhir</h3>
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Filter bulan</span>
              <input name="month" type="month" defaultValue={selectedMonth} />
            </label>
            <Button variant="soft">Terapkan</Button>
            <Button href={`/wallets/${walletId}/transactions`} variant="ghost">
              Reset
            </Button>
          </form>
          <div className="mt-6 space-y-3">
            {filteredTransactions.length === 0 ? <EmptyState title="Belum ada transaksi" description="Transaksi yang Anda simpan akan muncul di sini secara realtime dari database." /> : null}
            {filteredTransactions.slice(0, 12).map((transaction) => {
              const category = bundle.categories.find((item) => item.id === transaction.category_id);
              return (
                <div key={transaction.id} className="rounded-xl bg-muted p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{transaction.note || (transaction.kind === "income" ? "Pemasukan" : "Pengeluaran")}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {category?.name ?? "Tanpa kategori"} - {transaction.split_type ?? "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`metric ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
                        {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(transaction.happened_at)}</p>
                    </div>
                  </div>
                  <details className="mt-4 rounded-xl bg-white/80 p-3">
                    <summary className="cursor-pointer font-label text-sm text-muted-foreground">Edit transaksi</summary>
                    <form action={updateTransaction} className="mt-3 grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="wallet_id" value={walletId} />
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
                        <select name="category_id" defaultValue={transaction.category_id ?? ""}>
                          <option value="">Tanpa kategori</option>
                          {categories.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
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
                      <div className="md:col-span-2 flex flex-wrap gap-2">
                        <SubmitButton pendingText="Menyimpan..." variant="soft">
                          Update transaksi
                        </SubmitButton>
                      </div>
                    </form>
                  </details>
                  <form action={deleteTransaction} className="mt-2">
                    <input type="hidden" name="wallet_id" value={walletId} />
                    <input type="hidden" name="transaction_id" value={transaction.id} />
                    <ConfirmSubmitButton confirmMessage="Hapus transaksi ini?" pendingText="Menghapus..." variant="ghost">
                      Hapus transaksi
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
