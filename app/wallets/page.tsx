import { createWallet } from "@/app/actions/wallets";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatCurrency } from "@/lib/utils";

export default async function WalletsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireUser();
  const dashboard = await getDashboardData(user.id);

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
      <section className="mb-4 grid gap-4 rounded-2xl bg-white/75 p-4 shadow-serene xl:grid-cols-[1fr_360px]">
        <div>
          <p className="headline-md">Wallet terorganisir per tujuan dan per anggota.</p>
          <p className="mt-2 text-sm text-muted-foreground">Setiap wallet memiliki kategori, budget, anggota, split, dan laporan bulanan sendiri.</p>
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
                <option value="personal">Personal</option>
                <option value="shared">Shared</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Preset setup</span>
              <select name="setup_preset" defaultValue="standard">
                <option value="minimal">Minimal</option>
                <option value="standard">Standard</option>
                <option value="family">Family</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Preset budget</span>
              <select name="budget_preset" defaultValue="balanced">
                <option value="none">Tanpa budget otomatis</option>
                <option value="light">Light</option>
                <option value="balanced">Balanced</option>
                <option value="ambitious">Ambitious</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Preset setup menentukan kategori dan template transaksi awal. Preset budget akan membuat limit bulan berjalan yang masih bisa Anda ubah nanti.
          </p>
          {params.error ? <Notice tone="error">{params.error}</Notice> : null}
          {params.message ? <Notice tone="success">{params.message}</Notice> : null}
          <SubmitButton pendingText="Membuat wallet...">Buat wallet baru</SubmitButton>
        </form>
      </section>

      <section className="wallet-grid">
        {dashboard.wallets.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="Belum ada wallet"
              description="Gunakan form di atas untuk membuat wallet personal atau shared. Setelah itu Anda bisa mulai membuat transaksi, budget, dan laporan."
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
            <p className="metric mt-6 text-3xl">{formatCurrency(wallet.balance)}</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground">Spent</p>
                <p className="metric mt-2">{formatCurrency(wallet.spentThisMonth)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground">Budget</p>
                <p className="metric mt-2">{formatCurrency(wallet.budgetThisMonth)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-muted-foreground">Member</p>
                <p className="metric mt-2">{wallet.members}</p>
              </div>
            </div>
            <div className="mt-6">
              <a href={`/wallets/${wallet.id}`} className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 font-label text-sm text-white shadow-serene transition hover:bg-primary-strong">
                Buka wallet
              </a>
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
