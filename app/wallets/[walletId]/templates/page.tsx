import { notFound } from "next/navigation";
import { createTemplate } from "@/app/actions/templates";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { WalletTabs } from "@/components/wallet-tabs";
import { formatCurrency } from "@/lib/utils";

export default async function TemplatesPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const active = `/wallets/${walletId}/templates`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  return (
    <AppShell
      currentPath={active}
      title="Template"
      subtitle={`Template transaksi ${bundle.wallet.name}`}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <WalletTabs walletId={walletId} active={active} />
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="card">
          <p className="eyebrow">Buat template</p>
          <h3 className="headline-md mt-2">Transaksi cepat tanpa aturan otomatis</h3>
          <div className="mt-4 space-y-3">
            {query.error ? <Notice tone="error">{query.error}</Notice> : null}
            {query.message ? <Notice tone="success">{query.message}</Notice> : null}
          </div>
          <form action={createTemplate} className="mt-6 grid gap-4">
            <input type="hidden" name="wallet_id" value={walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Nama template</span>
              <input name="name" placeholder="Belanja mingguan" required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Jenis</span>
              <select name="kind" defaultValue="expense">
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Kategori</span>
              <select name="category_id" defaultValue="">
                <option value="">Tanpa kategori</option>
                {bundle.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Nominal default</span>
              <input name="default_amount" defaultValue="500000" inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Catatan</span>
              <input name="note" placeholder="Opsional" />
            </label>
            <SubmitButton pendingText="Menyimpan template...">Simpan template</SubmitButton>
          </form>
        </div>

        <div className="card">
          <p className="eyebrow">Template aktif</p>
          <h3 className="headline-md mt-2">Siap dipakai saat entry transaksi</h3>
          <div className="mt-6 stack-list">
            {bundle.templates.length === 0 ? <EmptyState title="Belum ada template" description="Simpan nominal dan kategori favorit kamu agar transaksi rutin bisa diulang lebih cepat." /> : null}
            {bundle.templates.map((template) => (
              <div key={template.name} className="list-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{bundle.categories.find((item) => item.id === template.category_id)?.name ?? template.kind}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="metric">{formatCurrency(template.default_amount ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
