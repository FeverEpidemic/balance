import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;
  const registerHref = params.next ? `/register?next=${encodeURIComponent(params.next)}` : "/register";

  return (
    <main className="page-wrap section-gap">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="card hidden lg:block">
          <p className="eyebrow">Masuk ke Balance App</p>
          <h1 className="headline-lg mt-4">Kembali ke dompet digital anda yang tenang dan terstruktur.</h1>
          <p className="mt-4 text-muted-foreground">
          Mulai mencatat kembali keuangan anda mulai dari sekarang.
          </p>
        </section>

        <section className="card">
          <div className="mx-auto max-w-md">
            <p className="eyebrow">Login</p>
            <h1 className="headline-lg mt-3">Masuk</h1>
            <div className="mt-6 space-y-3">
              {params.error ? <Notice tone="error">{params.error}</Notice> : null}
              {params.message ? <Notice tone="success">{params.message}</Notice> : null}
            </div>
            <form action={login} className="mt-8 space-y-4">
              <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Email</span>
                <input name="email" type="email" placeholder="nama@email.com" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Password</span>
                <input name="password" type="password" placeholder="Minimal 8 karakter" required minLength={8} />
              </label>
              <SubmitButton className="w-full" pendingText="Memeriksa akun...">
                Masuk ke dashboard
              </SubmitButton>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Button href={registerHref} variant="ghost" className="px-0 py-0">
                Daftar di sini
              </Button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
