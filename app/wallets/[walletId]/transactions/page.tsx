import { notFound } from "next/navigation";
import { createTransaction } from "@/app/actions/transactions";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
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
  searchParams: Promise<{ error?: string; message?: string }>;
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
          <div className="mt-6 space-y-3">
            {bundle.transactions.length === 0 ? <EmptyState title="Belum ada transaksi" description="Transaksi yang Anda simpan akan muncul di sini secara realtime dari database." /> : null}
            {bundle.transactions.slice(0, 12).map((transaction) => {
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
              </div>
            )})}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
