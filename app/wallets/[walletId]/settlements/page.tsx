import { notFound } from "next/navigation";
import { createSettlement } from "@/app/actions/settlements";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { WalletTabs } from "@/components/wallet-tabs";
import { formatCurrency } from "@/lib/utils";

export default async function SettlementsPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
  const active = `/wallets/${walletId}/settlements`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  return (
    <AppShell
      currentPath={active}
      title="Settlement"
      subtitle={`Settlement manual ${bundle.wallet.name}`}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <WalletTabs walletId={walletId} active={active} />
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <p className="eyebrow">Tambah settlement</p>
          <h3 className="headline-md mt-2">Kurangi saldo hutang antar anggota</h3>
          <div className="mt-4 space-y-3">
            {query.error ? <Notice tone="error">{query.error}</Notice> : null}
            {query.message ? <Notice tone="success">{query.message}</Notice> : null}
          </div>
          <form action={createSettlement} className="mt-6 grid gap-4">
            <input type="hidden" name="wallet_id" value={walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Dari</span>
              <select name="payer_user_id" defaultValue={bundle.members[0]?.user_id ?? ""} required>
                {bundle.members.map((member) => {
                  const profile = bundle.profileMap.get(member.user_id);
                  return (
                    <option key={member.user_id} value={member.user_id}>
                      {profile?.full_name || profile?.email || member.user_id}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Ke</span>
              <select name="payee_user_id" defaultValue={bundle.members[1]?.user_id ?? bundle.members[0]?.user_id ?? ""} required>
                {bundle.members.map((member) => {
                  const profile = bundle.profileMap.get(member.user_id);
                  return (
                    <option key={member.user_id} value={member.user_id}>
                      {profile?.full_name || profile?.email || member.user_id}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Nominal</span>
              <input name="amount" defaultValue="325000" inputMode="numeric" required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">Catatan</span>
              <input name="note" placeholder="Opsional" />
            </label>
            <SubmitButton pendingText="Menyimpan settlement...">Simpan settlement</SubmitButton>
          </form>
        </div>
        <div className="card">
          <p className="eyebrow">Outstanding</p>
          <h3 className="headline-md mt-2">Daftar settlement</h3>
          <div className="mt-6 space-y-3">
            {bundle.settlements.length === 0 ? <EmptyState title="Belum ada settlement" description="Settlement manual yang Anda simpan akan tercatat di sini." /> : null}
            {bundle.settlements.map((item) => {
              const payer = bundle.profileMap.get(item.payer_user_id);
              const payee = bundle.profileMap.get(item.payee_user_id);
              return (
              <div key={item.id} className="rounded-xl bg-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {(payer?.full_name || payer?.email || "Pengguna")} ke {(payee?.full_name || payee?.email || "Pengguna")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.note || "Settlement manual"}</p>
                  </div>
                  <p className="metric">{formatCurrency(item.amount)}</p>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
