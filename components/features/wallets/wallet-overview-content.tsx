import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { WalletTabs } from "@/components/wallet-tabs";
import type { WalletOverviewData } from "@/lib/data";

export function WalletOverviewContent({ data }: { data: WalletOverviewData }) {
  const active = `/wallets/${data.walletId}`;

  return (
    <AppShell
      currentPath="/wallets"
      title="Wallet"
      subtitle={`Ringkasan ${data.walletName}`}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <WalletTabs walletId={data.walletId} active={active} />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Saldo wallet" value={data.wallet.balance} detail="Akumulasi income dikurangi expense pada wallet ini" />
        <StatCard label="Budget bulan ini" value={data.wallet.budgetThisMonth} detail="Total budget yang aktif untuk bulan berjalan" />
        <StatCard label="Expense bulan ini" value={data.wallet.spentThisMonth} detail="Pengeluaran bulan berjalan pada wallet ini" />
      </section>
      <section className="mt-4 wallet-grid">
        <div className="card md:col-span-2">
          <p className="eyebrow">Aktivitas utama</p>
          <h3 className="headline-md mt-2">Data inti wallet</h3>
          {!data.hasTransactions ? (
            <div className="mt-6">
              <EmptyState title="Wallet masih kosong" description="Mulai dari transaksi pertama atau buat budget kategori untuk membentuk pola keuangan wallet ini." />
            </div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <p className="font-medium">Transaksi</p>
                <p className="mt-2 text-sm text-muted-foreground">{data.transactionCount} transaksi sudah tercatat.</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="font-medium">Kategori</p>
                <p className="mt-2 text-sm text-muted-foreground">{data.categoryCount} kategori aktif untuk income dan expense.</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="font-medium">Budget</p>
                <p className="mt-2 text-sm text-muted-foreground">{data.activeBudgetCount} budget kategori aktif pada bulan berjalan.</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="font-medium">Template</p>
                <p className="mt-2 text-sm text-muted-foreground">{data.templateCount} template transaksi siap dipakai ulang.</p>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <p className="eyebrow">Hak akses</p>
          <h3 className="headline-md mt-2">Peran anggota wallet</h3>
          <div className="mt-6 space-y-3 text-sm">
            {data.roleSummary.map((role) => (
              <div key={role.role} className="rounded-xl bg-muted p-4">
                <p className="font-medium capitalize">{role.role}</p>
                <p className="mt-2 text-muted-foreground">
                  {role.count} anggota dengan peran {role.role}.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
