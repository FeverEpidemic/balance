import { Button } from "@/components/ui/button";
import { signup } from "@/app/actions/auth";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function RegisterPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const loginHref = params.next ? `/login?next=${encodeURIComponent(params.next)}` : "/login";

  return (
    <main className="page-wrap section-gap">
      <div className="mx-auto max-w-2xl card">
        <p className="eyebrow">Daftar akun</p>
        <h1 className="headline-lg mt-3">Mulai dengan wallet pribadi atau wallet bersama.</h1>
        <div className="mt-6 space-y-3">
          {params.error ? <Notice tone="error">{params.error}</Notice> : null}
          {params.message ? <Notice tone="success">{params.message}</Notice> : null}
        </div>
        <form action={signup} className="mt-8 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="next" value={params.next ?? "/wallets?message=Akun aktif. Buat wallet pertama Anda."} />
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">Nama lengkap</span>
            <input name="full_name" placeholder="Ilham Pratama" required />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">Email</span>
            <input name="email" type="email" placeholder="nama@email.com" required />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-2 block font-label text-sm text-muted-foreground">Password</span>
            <input name="password" type="password" placeholder="Minimal 8 karakter" required minLength={8} />
          </label>
          <div className="md:col-span-2">
            <SubmitButton className="w-full" pendingText="Membuat akun...">
              Buat akun
            </SubmitButton>
          </div>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Button href={loginHref} variant="ghost" className="px-0 py-0">
            Login di sini
          </Button>
        </p>
      </div>
    </main>
  );
}
