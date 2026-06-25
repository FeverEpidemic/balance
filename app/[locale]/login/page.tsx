import { login } from "@/app/actions/auth";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { LandingLocaleSwitcher } from "@/components/landing/landing-locale-switcher";
import { getSiteUrl } from "@/lib/env";
import { getTranslator, resolveLocale } from "@/lib/i18n";

export default async function LoginPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  const query = await searchParams;
  const registerHref = query.next ? `/register?next=${encodeURIComponent(query.next)}` : "/register";
  const callbackUrl = new URL("/auth/callback", getSiteUrl());
  if (query.next) {
    callbackUrl.searchParams.set("next", query.next);
  }
  callbackUrl.searchParams.set("locale", locale);

  return (
    <>
      {/* Language switcher — top right corner */}
      <div className="fixed top-4 right-4 z-50 md:top-6 md:right-10">
        <LandingLocaleSwitcher />
      </div>

    <main className="page-wrap section-gap">
      <ToastFeedback error={query.error} message={query.message} />
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <AuthBrandPanel
          eyebrow={t("auth.loginPanelEyebrow")}
          title={t("auth.loginPanelTitle")}
          subtitle={t("auth.loginPanelSubtitle")}
          highlights={[
            { label: t("auth.highlightCashflowLabel"), value: t("auth.highlightCashflowValue") },
            { label: t("auth.highlightBudgetLabel"), value: t("auth.highlightBudgetValue") },
            { label: t("auth.highlightCollaborationLabel"), value: t("auth.highlightCollaborationValue") }
          ]}
          rhythmTitle={t("auth.rhythmTitle")}
          rhythmItems={[
            { label: t("auth.rhythmCashflowLabel"), value: t("auth.rhythmCashflowValue") },
            { label: t("auth.rhythmBudgetLabel"), value: t("auth.rhythmBudgetValue") },
            { label: t("auth.rhythmFamilyLabel"), value: t("auth.rhythmFamilyValue") }
          ]}
        />

        <section className="card min-w-0">
          <div className="mx-auto min-w-0 max-w-md">
            <p className="eyebrow">{t("auth.loginEyebrow")}</p>
            <h1 className="headline-lg mt-3">{t("auth.loginTitle")}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("auth.loginDescription")}</p>
            <div className="mt-8 min-w-0 space-y-4">
              <GoogleSignInButton callbackUrl={callbackUrl.toString()} label={t("auth.googleContinue")} />
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>{t("auth.loginEmailDivider")}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
            <form action={login} className="mt-8 min-w-0 space-y-4">
              <input type="hidden" name="next" value={query.next ?? "/dashboard"} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("common.email")}</span>
                <input name="email" type="email" placeholder="nama@email.com" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("common.password")}</span>
                <input name="password" type="password" placeholder={t("auth.loginPasswordPlaceholder")} required minLength={8} />
              </label>
              <SubmitButton className="w-full" pendingText={t("auth.loginPending")}>
                {t("auth.loginSubmit")}
              </SubmitButton>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("auth.loginNoAccount")}{" "}
              <Button href={registerHref} variant="ghost" className="min-h-0 rounded-none border-0 px-0 py-0 align-baseline shadow-none">
                {t("auth.loginRegisterLink")}
              </Button>
            </p>
          </div>
        </section>
      </div>
    </main>
    </>
  );
}
