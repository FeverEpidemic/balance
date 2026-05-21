import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/notice";
import { WalletTabs } from "@/components/wallet-tabs";

export default async function MembersPage({ params }: { params: Promise<{ walletId: string }> }) {
  const { walletId } = await params;
  const active = `/wallets/${walletId}/members`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  return (
    <AppShell
      currentPath={active}
      title="Anggota"
      subtitle={`Anggota ${bundle.wallet.name}`}
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
          <p className="eyebrow">Undang anggota</p>
          <h3 className="headline-md mt-2">Status saat ini</h3>
          <div className="mt-6">
            <Notice>
              Pengiriman email undangan belum dihubungkan ke SMTP aplikasi. Data anggota aktif sudah production-ready, tetapi fitur invite email perlu langkah backend tambahan.
            </Notice>
          </div>
        </div>

        <div className="card">
          <p className="eyebrow">Daftar anggota</p>
          <h3 className="headline-md mt-2">Hak akses wallet</h3>
          <div className="mt-6 space-y-3">
            {bundle.members.map((member) => {
              const profile = bundle.profileMap.get(member.user_id);
              return (
              <div key={member.user_id} className="flex flex-col gap-3 rounded-xl bg-muted p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{profile?.full_name || profile?.email || member.user_id}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{profile?.email || "-"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{member.role}</Badge>
                  <Badge tone="success">Aktif</Badge>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
