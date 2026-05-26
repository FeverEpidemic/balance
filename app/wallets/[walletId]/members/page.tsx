import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WalletTabs } from "@/components/wallet-tabs";
import { createInvitation, revokeInvitation } from "@/app/actions/invitations";

export default async function MembersPage({ params, searchParams }: { params: Promise<{ walletId: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const { walletId } = await params;
  const awaitedSearchParams = await searchParams;
  const active = `/wallets/${walletId}/members`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  const pendingInvitations = bundle.invitations.filter((inv) => inv.status === "pending");
  const currentUserRole = bundle.members.find((m) => m.user_id === user.id)?.role ?? "viewer";
  const isOwner = currentUserRole === "owner";

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

      {awaitedSearchParams.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {awaitedSearchParams.error}
        </div>
      )}
      {awaitedSearchParams.message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {awaitedSearchParams.message}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="card">
          <p className="eyebrow">Undang anggota</p>
          <h3 className="headline-md mt-2">Kirim undangan</h3>

          {isOwner ? (
            <form action={createInvitation} className="mt-6 space-y-4">
              <input type="hidden" name="wallet_id" value={walletId} />
              <div>
                <label htmlFor="invite-email" className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  id="invite-email"
                  name="email"
                  type="email"
                  required
                  placeholder="teman@email.com"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="block text-sm font-medium text-foreground mb-1">
                  Peran
                </label>
                <select
                  id="invite-role"
                  name="role"
                  defaultValue="viewer"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="viewer">Peninjau (hanya lihat)</option>
                  <option value="editor">Editor (dapat tambah & ubah data)</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                Kirim undangan
              </Button>
            </form>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Hanya pemilik wallet yang dapat mengundang anggota.</p>
          )}

          {pendingInvitations.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow">Undangan tertunda</p>
              <ul className="mt-4 space-y-3">
                {pendingInvitations.map((invitation) => (
                  <li key={invitation.id} className="flex flex-col gap-3 rounded-xl bg-muted p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-sm">{invitation.invited_email}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge>{invitation.role}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Kedaluwarsa {new Date(invitation.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    {isOwner && (
                      <form action={revokeInvitation}>
                        <input type="hidden" name="wallet_id" value={walletId} />
                        <input type="hidden" name="invitation_id" value={invitation.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Batalkan
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
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