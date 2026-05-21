import { notFound } from "next/navigation";
import { createWalletInvitation } from "@/app/actions/wallets";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/ui/notice";
import { WalletTabs } from "@/components/wallet-tabs";

export default async function MembersPage({
  params,
  searchParams
}: {
  params: Promise<{ walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { walletId } = await params;
  const query = await searchParams;
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
      <div className="mb-4 space-y-3">
        {query.error ? <Notice tone="error">{query.error}</Notice> : null}
        {query.message ? <Notice tone="success">{query.message}</Notice> : null}
      </div>
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="card">
          <p className="eyebrow">Undang anggota</p>
          <h3 className="headline-md mt-2">Aktifkan kolaborasi wallet</h3>
          {bundle.wallet.role === "owner" ? (
            <form action={createWalletInvitation} className="mt-6 grid gap-4">
              <input type="hidden" name="wallet_id" value={walletId} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Email anggota</span>
                <input name="invited_email" type="email" placeholder="partner@email.com" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Hak akses</span>
                <select name="role" defaultValue="viewer">
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </label>
              <SubmitButton pendingText="Mengirim undangan...">Kirim undangan email</SubmitButton>
            </form>
          ) : (
            <div className="mt-6">
              <Notice>Hanya owner wallet yang dapat mengundang anggota baru.</Notice>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <p className="font-label text-sm text-muted-foreground">Undangan aktif</p>
            {bundle.invitations.filter((invite) => invite.status === "pending").length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada undangan yang menunggu respons.</p>
            ) : (
              bundle.invitations
                .filter((invite) => invite.status === "pending")
                .map((invite) => (
                  <div key={invite.id} className="rounded-xl bg-muted p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{invite.invited_email}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Berlaku sampai{" "}
                          {new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short"
                          }).format(new Date(invite.expires_at))}
                        </p>
                      </div>
                      <Badge>{invite.role}</Badge>
                    </div>
                  </div>
                ))
            )}
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
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
