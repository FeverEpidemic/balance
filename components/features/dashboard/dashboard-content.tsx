import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import type { DashboardData } from "@/lib/data";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export function DashboardContent({ dashboard }: { dashboard: DashboardData }) {
  return (
    <AppShell
      currentPath="/dashboard"
      title="Dashboard"
      subtitle="Ringkasan finansial kamu"
      userName={dashboard.shell.userName}
      walletCount={dashboard.shell.walletCount}
      budgetCount={dashboard.shell.budgetCount}
      memberCount={dashboard.shell.memberCount}
      primaryWalletId={dashboard.shell.primaryWalletId}
    >
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Saldo tersedia" value={dashboard.totalAvailableBalance} detail="Saldo wallet di luar bucket saving" />
        <StatCard label="Saldo saving" value={dashboard.totalSavingBalance} detail="Akumulasi bucket saving seluruh wallet" />
        <StatCard label="Total saldo" value={dashboard.totalBalance} detail="Gabungan saldo tersedia dan saldo saving" />
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Pengeluaran bulan ini" value={dashboard.totalExpenseThisMonth} detail="Expense seluruh wallet untuk bulan berjalan" />
        <StatCard label="Outstanding split" value={dashboard.outstandingSplit} detail="Akumulasi sisa split yang belum tertutup" />
      </section>

      <section className="mt-4 data-grid">
        <div className="card lg:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Wallet aktif</p>
              <h3 className="headline-md mt-2">Kontrol saldo dan budget per wallet</h3>
            </div>
            <Button href="/wallets" variant="ghost">
              Lihat semua
            </Button>
          </div>
          <div className="wallet-grid mt-6">
            {dashboard.wallets.length === 0 ? (
              <div className="lg:col-span-2">
                <EmptyState
                  title="Belum ada wallet"
                  description="Buat wallet pertama Anda dari halaman Wallet untuk mulai mencatat transaksi dan mengundang anggota."
                />
              </div>
            ) : null}
            {dashboard.wallets.map((wallet) => (
              <div key={wallet.id} className="rounded-xl bg-muted p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg">{wallet.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{wallet.kind === "shared" ? "Wallet bersama" : "Wallet pribadi"}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-[rgba(89,95,61,0.1)] px-3 py-1 font-label text-xs text-primary-strong">{wallet.role}</span>
                </div>
                <p className="metric mt-4 text-2xl">{formatCurrency(wallet.totalBalance)}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-muted-foreground">Available</p>
                    <p className="metric mt-2">{formatCurrency(wallet.availableBalance)}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-muted-foreground">Saving</p>
                    <p className="metric mt-2">{formatCurrency(wallet.savingBalance)}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-white">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${wallet.budgetThisMonth > 0 ? Math.min((wallet.spentThisMonth / wallet.budgetThisMonth) * 100, 100) : 0}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>{wallet.members} anggota</span>
                  <span>{wallet.budgetThisMonth > 0 ? `${Math.round((wallet.spentThisMonth / wallet.budgetThisMonth) * 100)}% budget` : "Belum ada budget"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card lg:col-span-5">
          <p className="eyebrow">Komposisi kategori</p>
          <h3 className="headline-md mt-2">Pengeluaran terbesar bulan ini</h3>
          <div className="mt-6 space-y-4">
            {dashboard.categorySpend.length === 0 ? (
              <EmptyState title="Belum ada expense bulan ini" description="Setelah ada transaksi pengeluaran, kategori terbesar akan muncul di sini." />
            ) : null}
            {dashboard.categorySpend.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span>{item.name}</span>
                  <span className="metric">{formatCurrency(item.value)}</span>
                </div>
                <div className="h-3 rounded-full bg-muted">
                  <div className="h-3 rounded-full" style={{ width: `${Math.max((item.value / dashboard.categorySpend[0].value) * 100, 18)}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Transaksi terbaru</p>
            <h3 className="headline-md mt-2">Coba cek yuk transaksi terakhir kamu</h3>
          </div>
          <Button href={dashboard.shell.primaryWalletId ? `/wallets/${dashboard.shell.primaryWalletId}/transactions` : "/wallets"}>Tambah transaksi</Button>
        </div>
        <div className="mt-6 space-y-3">
          {dashboard.recentTransactions.length === 0 ? (
            <EmptyState title="Belum ada transaksi" description="Masukkan income atau expense dari wallet Anda untuk mulai melihat aktivitas terbaru." />
          ) : null}
          {dashboard.recentTransactions.map((transaction) => (
            <div key={transaction.id} className="flex flex-col gap-4 rounded-xl bg-muted p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{transaction.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {transaction.walletName} - {transaction.category} - {transaction.splitLabel}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className={`metric text-lg ${transaction.kind === "expense" ? "text-danger" : "text-success"}`}>
                  {formatCurrency(transaction.kind === "expense" ? -transaction.amount : transaction.amount)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{formatShortDate(transaction.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
