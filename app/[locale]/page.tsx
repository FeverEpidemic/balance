import type { Viewport } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHeroMockup } from "@/components/landing/landing-hero-mockup";
import { localizePath, resolveLocale, getTranslator } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#595f3d" },
    { media: "(prefers-color-scheme: dark)", color: "#1e261d" }
  ]
};

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
  const faqs = [
    { question: t("landing.faq1Question"), answer: t("landing.faq1Answer") },
    { question: t("landing.faq2Question"), answer: t("landing.faq2Answer") },
    { question: t("landing.faq3Question"), answer: t("landing.faq3Answer") },
    { question: t("landing.faq4Question"), answer: t("landing.faq4Answer") }
  ];

  return (
    <>
      <LandingHeader />
      <main className="landing-page page-wrap pb-12 pt-3 md:pb-16 md:pt-5">
      <section className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:py-14">
        <div>
          <p className="eyebrow">{t("landing.eyebrow")}</p>
          <h1 className="headline-xl mt-4 max-w-3xl">{t("landing.title")}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {t("landing.description")}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/register">{t("landing.registerButton")}</Button>
            <Button href="/login" variant="ghost">{t("landing.loginButton")}</Button>
          </div>
          <InstallPrompt />
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

        <LandingHeroMockup />
      </section>

      <section id="features" className="section-gap">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("landing.featuresEyebrow")}</p>
          <h2 className="headline-lg mt-3">{t("landing.featuresTitle")}</h2>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Badge>{t("landing.badgeWallets")}</Badge>
          <Badge>{t("landing.badgeFeatures")}</Badge>
          <Badge>{t("landing.badgeDarkMode")}</Badge>
          <Badge>{t("landing.badgeAiAssistant")}</Badge>
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

      <section id="how-it-works" className="section-gap">
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

      <section id="pricing" className="section-gap">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("landing.pricingEyebrow")}</p>
          <h2 className="headline-lg mt-3">{t("landing.pricingTitle")}</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            {t("landing.pricingDescription")}
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card p-6 md:p-8">
            <p className="headline-md">{t("landing.pricingFreeTitle")}</p>
            <p className="mt-2 metric text-2xl">{t("landing.pricingFreePrice")}</p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">• {t("landing.pricingFreeBullet1")}</li>
              <li className="flex items-start gap-2">• {t("landing.pricingFreeBullet2")}</li>
              <li className="flex items-start gap-2">• {t("landing.pricingFreeBullet3")}</li>
              <li className="flex items-start gap-2">• {t("landing.pricingFreeBullet4")}</li>
            </ul>
          </div>
          <div className="card relative p-6 ring-2 ring-primary md:p-8">
            <span className="absolute -top-3 right-6 rounded-full bg-primary px-4 py-1 text-xs font-medium text-white">
              {t("landing.pricingPremiumBadge")}
            </span>
            <p className="headline-md">{t("landing.pricingPremiumTitle")}</p>
            <p className="mt-2 metric text-2xl">{t("landing.pricingPremiumPrice")}</p>
            <span className="mt-1 inline-block text-xs text-muted-foreground">{t("landing.pricingAnnualHighlight")}</span>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">• {t("landing.pricingPremiumBullet1")}</li>
              <li className="flex items-start gap-2">• {t("landing.pricingPremiumBullet2")}</li>
              <li className="flex items-start gap-2">• {t("landing.pricingPremiumBullet3")}</li>
              <li className="flex items-start gap-2">• {t("landing.pricingPremiumBullet4")}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-gap">
        <div className="max-w-2xl">
          <h2 className="headline-lg">{t("landing.faqTitle")}</h2>
        </div>
        <div className="mt-6 space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="card group cursor-pointer">
              <summary className="headline-md list-none px-6 py-4">{faq.question}</summary>
              <p className="px-6 pb-4 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
            </details>
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
              <Button href="/register" className="bg-white text-primary-strong hover:bg-[#f4f1e5]">{t("landing.ctaRegister")}</Button>
              <Button href="/login" variant="ghost" className="border-white/30 text-white hover:bg-white/10">{t("landing.ctaLogin")}</Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-8 border-t border-border pt-8 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          <Link
            href={localizePath(locale, "/privacy")}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            {t("common.privacy")}
          </Link>
          <Link
            href={localizePath(locale, "/terms")}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            {t("common.terms")}
          </Link>
          <Link
            href={localizePath(locale, "/refund-policy")}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            {t("common.refundPolicy")}
          </Link>
        </div>
      </footer>
    </main>
    </>
  );
}
