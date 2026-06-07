import { Button } from "@/components/ui/button";
import { signup } from "@/app/actions/auth";
import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { getSiteUrl } from "@/lib/env";
import { getTranslator, resolveLocale } from "@/lib/i18n";

export default async function RegisterPage({
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
          eyebrow={t("auth.registerPanelEyebrow")}
          title={t("auth.registerPanelTitle")}
          subtitle={t("auth.registerPanelSubtitle")}
          highlights={[
            { label: t("auth.highlightSetupLabel"), value: t("auth.highlightSetupValue") },
            { label: t("auth.highlightWalletLabel"), value: t("auth.highlightWalletValue") },
            { label: t("auth.highlightFirstStepLabel"), value: t("auth.highlightFirstStepValue") }
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
            <p className="eyebrow">{t("auth.registerEyebrow")}</p>
            <h1 className="headline-lg mt-3">{t("auth.registerTitle")}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("auth.registerDescription")}
            </p>
            <div className="mt-8 min-w-0 space-y-4">
              <GoogleSignInButton callbackUrl={callbackUrl.toString()} label={t("auth.googleSignup")} />
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>{t("auth.registerDetailDivider")}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </div>
            <form action={signup} className="mt-8 grid min-w-0 gap-4 md:grid-cols-2">
              <input type="hidden" name="next" value={query.next ?? `/wallets?message=${encodeURIComponent(t("auth.accountActiveMessage"))}`} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("common.fullName")}</span>
                <input name="full_name" placeholder="Ilham Pratama" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("common.email")}</span>
                <input name="email" type="email" placeholder="nama@email.com" required />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("common.password")}</span>
                <input name="password" type="password" placeholder={t("auth.loginPasswordPlaceholder")} required minLength={8} />
              </label>
              <div className="md:col-span-2">
                <SubmitButton className="w-full" pendingText={t("auth.registerPending")}>
                  {t("auth.registerSubmit")}
                </SubmitButton>
              </div>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("auth.registerHasAccount")}{" "}
              <Button href={loginHref} variant="ghost" className="min-h-0 rounded-none border-0 px-0 py-0 align-baseline shadow-none">
                {t("auth.registerLoginLink")}
              </Button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
