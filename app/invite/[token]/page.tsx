import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/app/actions/invitations";

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string; message?: string }> }) {
  const { token } = await params;
  const awaitedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const currentUser = authData?.user ?? null;

  const { data: invitation } = await supabase
    .from("wallet_invitations")
    .select("id, wallet_id, invited_email, role, status, expires_at")
    .eq("token", token)
    .single();

  if (!invitation) {
    return (
      <main className="page-wrap section-gap">
        <div className="mx-auto max-w-2xl">
          <div className="card text-center">
            <Badge tone="danger">Tidak ditemukan</Badge>
            <h1 className="headline-lg mt-4">Undangan tidak ditemukan</h1>
            <p className="mt-4 text-muted-foreground">
              Token undangan tidak valid atau sudah dihapus. Silakan minta pemilik wallet mengirimkan undangan baru.
            </p>
            <div className="mt-8">
              <Button href="/dashboard">Kembali ke dashboard</Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isPending = invitation.status === "pending";
  const statusLabels: Record<string, { label: string; tone: "success" | "danger" | "default" }> = {
    accepted: { label: "Sudah diterima", tone: "success" },
    revoked: { label: "Sudah dibatalkan", tone: "danger" },
    expired: { label: "Sudah kedaluwarsa", tone: "danger" }
  };

  if (!isPending || isExpired) {
    const status = isPending && isExpired ? "expired" : invitation.status;
    const info = statusLabels[status] ?? { label: status, tone: "default" as const };
    return (
      <main className="page-wrap section-gap">
        <div className="mx-auto max-w-2xl">
          <div className="card text-center">
            <Badge tone={info.tone}>{info.label}</Badge>
            <h1 className="headline-lg mt-4">Undangan tidak tersedia</h1>
            <p className="mt-4 text-muted-foreground">
              {isExpired && isPending
                ? "Undangan ini sudah melewati batas waktu 7 hari. Silakan minta pemilik wallet mengirimkan undangan baru."
                : "Undangan ini sudah tidak berlaku. Silakan minta pemilik wallet mengirimkan undangan baru jika masih diperlukan."}
            </p>
            <div className="mt-8">
              <Button href="/dashboard">Kembali ke dashboard</Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="page-wrap section-gap">
        <div className="mx-auto max-w-2xl">
          <div className="card">
            <Badge>Undangan wallet</Badge>
            <h1 className="headline-lg mt-4">Gabung ke wallet bersama</h1>
            <p className="mt-4 text-muted-foreground">
              Anda diundang sebagai <strong>{invitation.role === "editor" ? "Editor" : "Peninjau"}</strong> di wallet ini.
              Login atau daftar untuk menerima undangan.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Button href={`/login?next=/invite/${token}`}>Login untuk menerima</Button>
              <Button href={`/register?next=/invite/${token}`} variant="ghost">
                Daftar akun baru
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const currentUserEmail = currentUser.email?.toLowerCase();
  const emailMatch = currentUserEmail === invitation.invited_email.toLowerCase();

  if (!emailMatch) {
    return (
      <main className="page-wrap section-gap">
        <div className="mx-auto max-w-2xl">
          <div className="card text-center">
            <Badge tone="danger">Email tidak cocok</Badge>
            <h1 className="headline-lg mt-4">Undangan untuk email lain</h1>
            <p className="mt-4 text-muted-foreground">
              Undangan ini ditujukan untuk <strong>{invitation.invited_email}</strong>, tetapi Anda login sebagai{" "}
              <strong>{currentUser.email}</strong>. Silakan login dengan email yang diundang.
            </p>
            <div className="mt-8">
              <Button href="/login">Ganti akun</Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const roleLabel = invitation.role === "editor" ? "Editor" : "Peninjau";

  return (
    <main className="page-wrap section-gap">
      <div className="mx-auto max-w-2xl">
        <div className="card">
          <Badge>Undangan wallet</Badge>
          <h1 className="headline-lg mt-4">Anda diundang bergabung</h1>
          <p className="mt-4 text-muted-foreground">
            Anda diundang sebagai <strong>{roleLabel}</strong>. Terima undangan ini untuk mulai melihat dan mengelola data keuangan wallet.
          </p>

          {awaitedSearchParams.error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {awaitedSearchParams.error}
            </div>
          )}
          {awaitedSearchParams.message && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {awaitedSearchParams.message}
            </div>
          )}

          <div className="mt-8 rounded-xl bg-muted p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium text-sm">{invitation.invited_email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Peran</p>
                <p className="font-medium text-sm">{roleLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Akun Anda</p>
                <p className="font-medium text-sm">{currentUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kedaluwarsa</p>
                <p className="font-medium text-sm">
                  {new Date(invitation.expires_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          <form action={acceptInvitation} className="mt-8 grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="token" value={token} />
            <Button type="submit">Terima undangan</Button>
            <Button href="/dashboard" variant="ghost">
              Nanti saja
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}