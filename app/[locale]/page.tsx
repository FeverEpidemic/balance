import { redirect } from "next/navigation";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localizePath, resolveLocale, getTranslator } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect(localizePath(locale, "/dashboard"));
  }

  const featureCards = [
    { title: t("landing.feature1Title"), description: t("landing.feature1Description") },
    { title: t("landing.feature2Title"), description: t("landing.feature2Description") },
    { title: t("landing.feature3Title"), description: t("landing.feature3Description") },
    { title: t("landing.feature4Title"), description: t("landing.feature4Description") }
  ];
  const steps = [
    { number: "01", title: t("landing.step1Title"), description: t("landing.step1Description") },
    { number: "02", title: t("landing.step2Title"), description: t("landing.step2Description") },
    { number: "03", title: t("landing.step3Title"), description: t("landing.step3Description") }
  ];
  const useCases = [
    { title: t("landing.useCase1Title"), description: t("landing.useCase1Description") },
    { title: t("landing.useCase2Title"), description: t("landing.useCase2Description") }
  ];

  return (
    <main className="page-wrap pb-12 pt-6 md:pb-16 md:pt-8">
      <section className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:py-14">
        <div>
          <p className="eyebrow">{t("landing.eyebrow")}</p>
          <h1 className="headline-xl mt-4 max-w-3xl">{t("landing.title")}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {t("landing.description")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={localizePath(locale, "/register")}>{t("landing.registerButton")}</Button>
            <Button href={localizePath(locale, "/login")} variant="ghost">{t("landing.loginButton")}</Button>
          </div>
          <InstallPrompt />
          <div className="mt-8 flex flex-wrap gap-3">
            <Badge>{t("landing.badgeLanguage")}</Badge>
            <Badge>{t("landing.badgeWallets")}</Badge>
            <Badge>{t("landing.badgeFeatures")}</Badge>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="card-muted p-4">
              <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("landing.card1Label")}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("landing.card1Description")}</p>
            </div>
            <div className="card-muted p-4">
              <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("landing.card2Label")}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("landing.card2Description")}</p>
            </div>
            <div className="card-muted p-4">
              <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("landing.card3Label")}</p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("landing.card3Description")}</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-x-8 top-4 h-40 rounded-full bg-primary-soft/60 blur-3xl" />
          <div className="glass-panel-strong relative overflow-hidden rounded-[2rem] p-4 shadow-float md:p-6">
            <div className="rounded-[1.5rem] bg-primary px-5 py-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-label text-xs uppercase tracking-[0.18em] text-white/70">{t("landing.summaryLabel")}</p>
                  <p className="metric mt-4 text-3xl md:text-[2.5rem]">Rp12.450.000</p>
                </div>
                <div className="rounded-full bg-white/12 px-3 py-2 font-label text-xs text-white">{t("landing.summaryStatus")}</div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">{t("landing.summaryDescription")}</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="card p-5">
                <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("landing.budgetLabel")}</p>
                <p className="metric mt-3 text-2xl">68%</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("landing.budgetDescription")}</p>
              </div>
              <div className="card p-5">
                <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("landing.splitLabel")}</p>
                <p className="metric mt-3 text-2xl">Rp950.000</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("landing.splitDescription")}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="card-muted p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("landing.savingLabel")}</p>
                    <p className="headline-md mt-2">{t("landing.savingTitle")}</p>
                  </div>
                  <Badge>{t("landing.savingBadge")}</Badge>
                </div>
                <div className="mt-4 h-3 rounded-full bg-card">
                  <div className="h-3 w-[74%] rounded-full bg-primary" />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("landing.savingDescription")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-gap">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("landing.featuresEyebrow")}</p>
          <h2 className="headline-lg mt-3">{t("landing.featuresTitle")}</h2>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {featureCards.map((feature) => (
            <article key={feature.title} className="card">
              <p className="headline-md">{feature.title}</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-gap">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="max-w-xl">
            <p className="eyebrow">{t("landing.stepsEyebrow")}</p>
            <h2 className="headline-lg mt-3">{t("landing.stepsTitle")}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">{t("landing.stepsDescription")}</p>
          </div>
          <div className="grid gap-4">
            {steps.map((step) => (
              <article key={step.number} className="card flex flex-col gap-3 md:flex-row md:items-start md:gap-5">
                <div className="metric text-2xl text-primary">{step.number}</div>
                <div>
                  <p className="headline-md">{step.title}</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground md:text-base">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-gap">
        <div className="grid gap-4 lg:grid-cols-2">
          {useCases.map((useCase) => (
            <article key={useCase.title} className="card-muted rounded-[1.5rem] p-6 md:p-7">
              <p className="eyebrow">{t("landing.useCaseEyebrow")}</p>
              <h2 className="headline-md mt-3">{useCase.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{useCase.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-gap">
        <div className="overflow-hidden rounded-[2rem] bg-primary px-6 py-8 text-white shadow-float md:px-10 md:py-10">
          <div className="max-w-3xl">
            <p className="eyebrow text-white/70">{t("landing.ctaEyebrow")}</p>
            <h2 className="headline-lg mt-3 text-white">{t("landing.ctaTitle")}</h2>
            <p className="mt-4 text-base leading-7 text-white/75 md:text-lg">{t("landing.ctaDescription")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href={localizePath(locale, "/register")} className="bg-white text-primary-strong hover:bg-[#f4f1e5]">{t("landing.ctaRegister")}</Button>
              <Button href={localizePath(locale, "/login")} variant="ghost" className="border-white/30 text-white hover:bg-white/10">{t("landing.ctaLogin")}</Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
