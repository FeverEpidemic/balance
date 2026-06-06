import { AppShell } from "@/components/app-shell";
import { DashboardOnboardingCard } from "@/components/features/dashboard/dashboard-onboarding-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import type { DashboardData } from "@/lib/data";
import { formatCurrency, formatShortDate } from "@/lib/utils";

export function DashboardContent({ dashboard }: { dashboard: DashboardData }) {
  const transactionsHref = dashboard.shell.primaryWalletId ? `/wallets/${dashboard.shell.primaryWalletId}/transactions` : "/wallets";

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
      headerAction={
        <Button
          href={transactionsHref}
          variant="soft"
          className="min-h-[2.75rem] min-w-[2.75rem] rounded-full border border-border bg-overlay px-0 py-0 shadow-none hover:shadow-none"
        >
          <span
            aria-hidden="true"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card ring-1 ring-inset ring-border"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-3 w-3" role="img">
              <path d="M10 4.5V15.5M4.5 10H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </span>
          <span className="sr-only">Tambah transaksi</span>
        </Button>
      }
    >
      <DashboardOnboardingCard onboarding={dashboard.onboarding} />

      <section id="ringkasan-finansial" className="grid gap-4 scroll-mt-28 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Saldo tersedia" value={dashboard.totalAvailableBalance} detail="Saldo semua wallet yang masih siap dipakai di luar tabungan." />
        <StatCard label="Saldo tabungan" value={dashboard.totalSavingBalance} detail="Akumulasi tabungan yang sudah dipisahkan dari seluruh wallet." />
        <StatCard label="Total saldo" value={dashboard.totalBalance} detail="Gabungan saldo siap pakai dan tabungan di semua wallet." />
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Pengeluaran bulan ini" value={dashboard.totalExpenseThisMonth} detail="Pengeluaran seluruh wallet pada bulan berjalan." />
        <StatCard label="Sisa split bill" value={dashboard.outstandingSplit} detail="Akumulasi patungan yang masih perlu dibereskan antar anggota." />
      </section>

      <section className="mt-4 grid gap-4 2xl:grid-cols-12">
        <div className="card 2xl:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Wallet aktif</p>
              <h3 className="headline-md mt-2">Kontrol saldo dan anggaran per wallet</h3>
            </div>
            <Button href="/wallets" variant="ghost">
              Lihat semua
            </Button>
          </div>
          <div className="mt-6 grid gap-4 xl:grid-cols-2 min-[1700px]:grid-cols-3">
            {dashboard.wallets.length === 0 ? (
              <div className="lg:col-span-2">
                <EmptyState
                  title="Belum ada wallet"
                  description="Buat wallet pertama dari halaman Wallet untuk mulai mencatat transaksi dan mengundang anggota."
                />
              </div>
            ) : null}
            {dashboard.wallets.map((wallet) => (
              <div key={wallet.id} className="info-tile">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg">{wallet.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{wallet.kind === "shared" ? "Wallet bersama" : "Wallet pribadi"}</p>
                  </div>
                  <span className="theme-primary-pill inline-flex rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]">{wallet.role}</span>
                </div>
                <p className="metric mt-4 text-2xl">{formatCurrency(wallet.totalBalance)}</p>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="subtle-panel">
                    <p className="text-muted-foreground">Saldo siap pakai</p>
                    <p className="metric mt-2">{formatCurrency(wallet.availableBalance)}</p>
                  </div>
                  <div className="subtle-panel">
                    <p className="text-muted-foreground">Saldo tabungan</p>
                    <p className="metric mt-2">{formatCurrency(wallet.savingBalance)}</p>
                  </div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-card">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${wallet.budgetThisMonth > 0 ? Math.min((wallet.spentThisMonth / wallet.budgetThisMonth) * 100, 100) : 0}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>{wallet.members} anggota</span>
                  <span>{wallet.budgetThisMonth > 0 ? `${Math.round((wallet.spentThisMonth / wallet.budgetThisMonth) * 100)}% anggaran terpakai` : "Belum ada anggaran"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card 2xl:col-span-5">
          <p className="eyebrow">Komposisi kategori</p>
          <h3 className="headline-md mt-2">Pengeluaran terbesar bulan ini</h3>
          <div className="mt-6 stack-list">
            {dashboard.categorySpend.length === 0 ? (
              <EmptyState title="Belum ada pengeluaran bulan ini" description="Setelah ada transaksi pengeluaran, kategori terbesar akan muncul di sini." />
            ) : null}
            {dashboard.categorySpend.map((item) => (
              <div key={item.name} className="list-card">
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
            <h3 className="headline-md mt-2">Transaksi terbaru yang perlu kamu pantau</h3>
          </div>
          <Button href={transactionsHref} variant="ghost">
            Lihat semua
          </Button>
        </div>
        <div className="mt-6 space-y-3">
          {dashboard.recentTransactions.length === 0 ? (
            <EmptyState title="Belum ada transaksi" description="Masukkan pemasukan atau pengeluaran untuk mulai melihat aktivitas terbaru." />
          ) : null}
          {dashboard.recentTransactions.map((transaction) => (
            <div key={transaction.id} className="list-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{transaction.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{transaction.walletName} • {transaction.category} • {transaction.splitLabel}</p>
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
