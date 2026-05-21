import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { WalletTabs } from "@/components/wallet-tabs";

export default async function WalletOverviewPage({ params }: { params: Promise<{ walletId: string }> }) {
  const { walletId } = await params;
  const basePath = `/wallets/${walletId}`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  return (
    <AppShell
      currentPath="/wallets"
      title="Wallet"
      subtitle={`Ringkasan ${bundle.wallet.name}`}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <WalletTabs walletId={walletId} active={basePath} />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Saldo wallet" value={bundle.wallet.balance} detail="Akumulasi income dikurangi expense pada wallet ini" />
        <StatCard label="Budget bulan ini" value={bundle.wallet.budgetThisMonth} detail="Total budget yang aktif untuk bulan berjalan" />
        <StatCard label="Expense bulan ini" value={bundle.wallet.spentThisMonth} detail="Pengeluaran bulan berjalan pada wallet ini" />
      </section>
      <section className="mt-4 wallet-grid">
        <div className="card md:col-span-2">
          <p className="eyebrow">Aktivitas utama</p>
          <h3 className="headline-md mt-2">Data inti wallet</h3>
          {bundle.transactions.length === 0 ? (
            <div className="mt-6">
              <EmptyState title="Wallet masih kosong" description="Mulai dari transaksi pertama atau buat budget kategori untuk membentuk pola keuangan wallet ini." />
            </div>
          ) : (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <p className="font-medium">Transaksi</p>
                <p className="mt-2 text-sm text-muted-foreground">{bundle.transactions.length} transaksi sudah tercatat.</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="font-medium">Kategori</p>
                <p className="mt-2 text-sm text-muted-foreground">{bundle.categories.length} kategori aktif untuk income dan expense.</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="font-medium">Budget</p>
                <p className="mt-2 text-sm text-muted-foreground">{bundle.budgets.length} budget kategori aktif pada bulan berjalan.</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="font-medium">Template</p>
                <p className="mt-2 text-sm text-muted-foreground">{bundle.templates.length} template transaksi siap dipakai ulang.</p>
              </div>
            </div>
          )}
        </div>
        <div className="card">
          <p className="eyebrow">Hak akses</p>
          <h3 className="headline-md mt-2">Peran anggota wallet</h3>
          <div className="mt-6 space-y-3 text-sm">
            {["owner", "editor", "viewer"].map((role) => (
              <div key={role} className="rounded-xl bg-muted p-4">
                <p className="font-medium capitalize">{role}</p>
                <p className="mt-2 text-muted-foreground">
                  {bundle.members.filter((member) => member.role === role).length} anggota dengan peran {role}.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
