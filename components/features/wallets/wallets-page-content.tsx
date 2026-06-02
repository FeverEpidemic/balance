import { createWallet } from "@/app/actions/wallets";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import type { DashboardData } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export function WalletsPageContent({
  dashboard,
  feedback
}: {
  dashboard: DashboardData;
  feedback: { error?: string; message?: string };
}) {
  return (
    <AppShell
      currentPath="/wallets"
      title="Wallet"
      subtitle="Kelola wallet pribadi dan wallet bersama"
      userName={dashboard.shell.userName}
      walletCount={dashboard.shell.walletCount}
      budgetCount={dashboard.shell.budgetCount}
      memberCount={dashboard.shell.memberCount}
      primaryWalletId={dashboard.shell.primaryWalletId}
    >
      <ToastFeedback error={feedback.error} message={feedback.message} />
      <section className="mb-4 grid gap-4 rounded-2xl bg-white/75 p-4 shadow-serene xl:grid-cols-[1fr_360px]">
        <div>
          <p className="headline-md">Wallet terorganisir per tujuan dan per anggota.</p>
          <p className="mt-2 text-sm text-muted-foreground">Setiap wallet memiliki kategori, anggaran, anggota, split bill, dan laporan bulanan sendiri.</p>
        </div>
        <form action={createWallet} className="grid gap-3 rounded-2xl bg-muted p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Nama wallet</span>
              <input name="name" placeholder="Rumah Utama" required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Jenis</span>
              <select name="kind" defaultValue="personal">
                <option value="personal">Pribadi</option>
                <option value="shared">Bersama</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Preset awal</span>
              <select name="setup_preset" defaultValue="standard">
                <option value="minimal">Minimal</option>
                <option value="standard">Standar</option>
                <option value="family">Keluarga</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Preset anggaran</span>
              <select name="budget_preset" defaultValue="balanced">
                <option value="none">Tanpa anggaran otomatis</option>
                <option value="light">Ringan</option>
                <option value="balanced">Seimbang</option>
                <option value="ambitious">Agresif</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Preset awal menentukan kategori dan template transaksi. Preset anggaran akan membuat limit bulan berjalan yang masih bisa kamu ubah nanti.
          </p>
          <SubmitButton pendingText="Membuat wallet...">Buat wallet baru</SubmitButton>
        </form>
      </section>

      <section className="wallet-grid">
        {dashboard.wallets.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="Belum ada wallet"
              description="Gunakan form di atas untuk membuat wallet pribadi atau bersama. Setelah itu kamu bisa mulai membuat transaksi, anggaran, dan laporan."
            />
          </div>
        ) : null}
        {dashboard.wallets.map((wallet) => (
          <article key={wallet.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl">{wallet.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{wallet.kind === "shared" ? "Wallet bersama" : "Wallet pribadi"}</p>
              </div>
              <Badge>{wallet.role}</Badge>
            </div>
            <p className="metric mt-6 text-3xl">{formatCurrency(wallet.totalBalance)}</p>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div className="info-tile">
                <p className="text-muted-foreground">Saldo siap pakai</p>
                <p className="metric mt-2">{formatCurrency(wallet.availableBalance)}</p>
              </div>
              <div className="info-tile">
                <p className="text-muted-foreground">Saldo tabungan</p>
                <p className="metric mt-2">{formatCurrency(wallet.savingBalance)}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div className="info-tile">
                <p className="text-muted-foreground">Terpakai</p>
                <p className="metric mt-2">{formatCurrency(wallet.spentThisMonth)}</p>
              </div>
              <div className="info-tile">
                <p className="text-muted-foreground">Anggaran</p>
                <p className="metric mt-2">{formatCurrency(wallet.budgetThisMonth)}</p>
              </div>
              <div className="info-tile">
                <p className="text-muted-foreground">Anggota</p>
                <p className="metric mt-2">{wallet.members}</p>
              </div>
            </div>
            <div className="mt-6">
              <Button href={`/wallets/${wallet.id}`} className="w-full">
                Buka wallet
              </Button>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
