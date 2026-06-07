import { Button } from "@/components/ui/button";
import { signup } from "@/app/actions/auth";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { getSiteUrl } from "@/lib/env";
import { resolveLocale } from "@/lib/i18n";

export default async function RegisterPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const query = await searchParams;
  const loginHref = query.next ? `/login?next=${encodeURIComponent(query.next)}` : "/login";
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
          eyebrow="Mulai dengan Balance"
          title="Buat kesan pertama yang tenang sejak catatan keuangan pertama."
          subtitle="Daftar untuk mulai mengatur wallet pribadi atau bersama, mencatat transaksi lebih rapi, dan membangun kebiasaan finansial yang terasa ringan dijalani."
          highlights={[
            { label: "Setup awal", value: "Cepat dipakai" },
            { label: "Wallet", value: "Pribadi atau bersama" },
            { label: "First step", value: "Lebih meyakinkan" }
          ]}
        />

        <section className="card min-w-0">
          <div className="mx-auto min-w-0 max-w-md">
            <p className="eyebrow">Daftar akun</p>
            <h1 className="headline-lg mt-3">Mulai dengan wallet pribadi atau wallet bersama.</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Buat akun dulu, lalu lanjutkan dengan wallet pertama Anda untuk mulai mencatat, mengatur anggaran, dan berbagi akses bila dibutuhkan.
            </p>
            <div className="mt-8 min-w-0 space-y-4">
              <GoogleSignInButton callbackUrl={callbackUrl.toString()} label={locale === "en" ? "Sign up with Google" : "Daftar dengan Google"} />
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>{locale === "en" ? "or fill in your account details" : "atau isi data akun"}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
            <form action={signup} className="mt-8 grid min-w-0 gap-4 md:grid-cols-2">
              <input type="hidden" name="next" value={query.next ?? "/wallets?message=Akun aktif. Buat wallet pertama Anda."} />
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
                <input name="password" type="password" placeholder={locale === "en" ? "Minimum 8 characters" : "Minimal 8 karakter"} required minLength={8} />
              </label>
              <div className="md:col-span-2">
                <SubmitButton className="w-full" pendingText={locale === "en" ? "Creating account..." : "Membuat akun..."}>
                  {locale === "en" ? "Create account" : "Buat akun"}
                </SubmitButton>
              </div>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              {locale === "en" ? "Already have an account?" : "Sudah punya akun?"}{" "}
              <Button href={loginHref} variant="ghost" className="min-h-0 rounded-none border-0 px-0 py-0 align-baseline shadow-none">
                {locale === "en" ? "Sign in here" : "Login di sini"}
              </Button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
