import { acceptWalletInvitation } from "@/app/actions/wallets";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";

type InviteRecord = {
  id: string;
  wallet_id: string;
  role: "owner" | "editor" | "viewer";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
};

export default async function InvitePage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let invitation: InviteRecord | null = null;
  let walletName = "Wallet bersama";

  if (admin) {
    const { data } = await admin
      .from("wallet_invitations")
      .select("id, wallet_id, role, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    invitation = (data as InviteRecord | null) ?? null;

    if (invitation) {
      const { data: wallet } = await admin.from("wallets").select("name").eq("id", invitation.wallet_id).maybeSingle();
      walletName = wallet?.name ?? walletName;
    }
  }

  const nextHref = encodeURIComponent(`/invite/${token}`);
  const isExpired = invitation ? new Date(invitation.expires_at).getTime() < Date.now() : false;

  return (
    <main className="page-wrap section-gap">
      <div className="mx-auto max-w-2xl card">
        <Badge>Undangan wallet</Badge>
        <h1 className="headline-lg mt-4">Gabung ke wallet bersama</h1>
        <div className="mt-6 space-y-3">
          {query.error ? <Notice tone="error">{query.error}</Notice> : null}
          {query.message ? <Notice tone="success">{query.message}</Notice> : null}
        </div>

        {!admin ? (
          <div className="mt-4">
            <Notice tone="error">SUPABASE_SECRET_KEY belum diisi, jadi data undangan tidak bisa diverifikasi.</Notice>
          </div>
        ) : !invitation ? (
          <div className="mt-4">
            <Notice tone="error">Undangan tidak ditemukan atau token sudah tidak berlaku.</Notice>
          </div>
        ) : (
          <>
            <p className="mt-4 text-muted-foreground">
              Anda diundang ke <span className="font-label text-foreground">{walletName}</span> sebagai{" "}
              <span className="font-label text-foreground">{invitation.role}</span>. Jika Anda menerima undangan ini,
              akun yang sedang login akan ditambahkan ke wallet tersebut.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Berlaku sampai{" "}
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "medium",
                timeStyle: "short"
              }).format(new Date(invitation.expires_at))}
            </p>
          </>
        )}

        <div className="mt-8 grid gap-3">
          {!invitation || !admin ? null : invitation.status === "accepted" ? (
            <Notice tone="success">Undangan ini sudah diterima sebelumnya.</Notice>
          ) : invitation.status === "revoked" ? (
            <Notice tone="error">Undangan ini sudah dibatalkan oleh pemilik wallet.</Notice>
          ) : isExpired || invitation.status === "expired" ? (
            <Notice tone="error">Undangan ini sudah kedaluwarsa.</Notice>
          ) : !user ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button href={`/login?next=${nextHref}`}>Login untuk menerima</Button>
              <Button href={`/register?next=${nextHref}`} variant="ghost">
                Daftar akun baru
              </Button>
            </div>
          ) : (
            <form action={acceptWalletInvitation}>
              <input type="hidden" name="token" value={token} />
              <SubmitButton className="w-full" pendingText="Menerima undangan...">
                Terima undangan
              </SubmitButton>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
