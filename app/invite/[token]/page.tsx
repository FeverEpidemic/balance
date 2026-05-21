import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <main className="page-wrap section-gap">
      <div className="mx-auto max-w-2xl card">
        <Badge>Undangan wallet</Badge>
        <h1 className="headline-lg mt-4">Gabung ke wallet bersama</h1>
        <p className="mt-4 text-muted-foreground">
          Token undangan <span className="font-label text-foreground">{token}</span> siap diterima setelah login atau registrasi.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Button href="/login">Login untuk menerima</Button>
          <Button href="/register" variant="ghost">
            Daftar akun baru
          </Button>
        </div>
      </div>
    </main>
  );
}
