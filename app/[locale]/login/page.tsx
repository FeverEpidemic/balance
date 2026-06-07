import { login } from "@/app/actions/auth";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { getSiteUrl } from "@/lib/env";
import { resolveLocale } from "@/lib/i18n";

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const query = await searchParams;
  const registerHref = query.next ? `/register?next=${encodeURIComponent(query.next)}` : "/register";
  const callbackUrl = new URL("/auth/callback", getSiteUrl());
  if (query.next) {
    callbackUrl.searchParams.set("next", query.next);
  }
  callbackUrl.searchParams.set("locale", locale);

  return (
    <main className="page-wrap section-gap">
      <ToastFeedback error={query.error} message={query.message} />
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <AuthBrandPanel
          eyebrow="Masuk ke Balance App"
          title="Kembali ke dompet digital Anda yang tenang dan terstruktur."
          subtitle="Lanjutkan pencatatan keuangan rumah tangga dengan tampilan yang ringan, angka yang rapi, dan ritme yang tidak bikin sesak."
          highlights={[
            { label: "Arus kas", value: "Lebih tertata" },
            { label: "Anggaran", value: "Mudah dipantau" },
            { label: "Kolaborasi", value: "Siap dibagi" }
          ]}
        />

        <section className="card min-w-0">
          <div className="mx-auto min-w-0 max-w-md">
            <p className="eyebrow">Login</p>
            <h1 className="headline-lg mt-3">Masuk</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Masuk lagi untuk melanjutkan transaksi, anggaran, dan ringkasan wallet Anda.</p>
            <div className="mt-8 min-w-0 space-y-4">
          <GoogleSignInButton callbackUrl={callbackUrl.toString()} label={locale === "en" ? "Continue with Google" : "Masuk dengan Google"} />
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
                <span>{locale === "en" ? "or continue with email" : "atau lanjut dengan email"}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
            <form action={login} className="mt-8 min-w-0 space-y-4">
              <input type="hidden" name="next" value={query.next ?? "/dashboard"} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Email</span>
                <input name="email" type="email" placeholder="nama@email.com" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">Password</span>
                <input name="password" type="password" placeholder={locale === "en" ? "Minimum 8 characters" : "Minimal 8 karakter"} required minLength={8} />
              </label>
              <SubmitButton className="w-full" pendingText={locale === "en" ? "Checking account..." : "Memeriksa akun..."}>
                {locale === "en" ? "Sign in to dashboard" : "Masuk ke dashboard"}
              </SubmitButton>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              {locale === "en" ? "Don't have an account yet?" : "Belum punya akun?"}{" "}
              <Button href={registerHref} variant="ghost" className="min-h-0 rounded-none border-0 px-0 py-0 align-baseline shadow-none">
                {locale === "en" ? "Sign up here" : "Daftar di sini"}
              </Button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
