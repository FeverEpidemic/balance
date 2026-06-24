import type { Viewport } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHeroMockup } from "@/components/landing/landing-hero-mockup";
import { LandingAppPreview } from "@/components/landing/landing-app-preview";
import { LandingScrollObserver } from "@/components/landing/landing-scroll-observer";
import { LandingFooter } from "@/components/landing/landing-footer";
import { AppIcon } from "@/components/ui/app-icon";
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

  // Icon mapping for feature cards — matches AppIcon "name" prop type
  const featureIcons = [
    "transactions" as const,
    "budgets" as const,
    "settlements" as const,
    "savings" as const,
  ];

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
      <main className="landing-page page-wrap pb-12 pt-3 md:pb-16 md:pt-5 overflow-hidden">
        {/* Scroll observer to trigger animations */}
        <LandingScrollObserver />

        {/* Hero Section */}
        <section className="fade-in-section grid gap-10 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:py-14">
          <div>
            <p className="eyebrow">{t("landing.eyebrow")}</p>
            <h1 className="headline-xl mt-4 max-w-3xl leading-tight whitespace-pre-line">
              {t("landing.titleLine1")}
              <br />
              {t("landing.titleLine2")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {t("landing.description")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button href="/register">{t("landing.registerButton")}</Button>
              <Button href="/login" variant="ghost">{t("landing.loginButton")}</Button>
            </div>
            <InstallPrompt />
          </div>

          <LandingHeroMockup />
        </section>

        {/* Features Section */}
        <section id="features" className="fade-in-section section-gap">
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
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {featureCards.map((feature, index) => (
              <article key={feature.title} className="card card-interactive-glow border border-border/40 p-6">
                <AppIcon
                  name={featureIcons[index]}
                  className="mb-4 h-8 w-8"
                  tone="primary"
                />
                <p className="headline-md font-semibold text-foreground">{feature.title}</p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* App Preview Section */}
        <section className="fade-in-section section-gap">
          <div className="max-w-2xl">
            <p className="eyebrow">{t("landing.previewEyebrow")}</p>
            <h2 className="headline-lg mt-3">{t("landing.previewTitle")}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              {t("landing.previewDescription")}
            </p>
          </div>
          <div className="mt-10">
            <LandingAppPreview />
          </div>
        </section>

        {/* Trust Metrics */}
        <section className="fade-in-section section-gap">
          <div className="overflow-hidden rounded-[2rem] bg-card-elevated px-6 py-10 md:px-12 md:py-12 border border-border/30">
            <div className="max-w-2xl">
              <p className="eyebrow">{t("landing.metricsEyebrow")}</p>
              <h2 className="headline-lg mt-3">{t("landing.metricsTitle")}</h2>
            </div>
            <div className="mt-10 grid gap-8 text-center sm:grid-cols-3">
              <div>
                <p className="metric text-4xl font-bold text-primary md:text-5xl">
                  {t("landing.metric1Value")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("landing.metric1Label")}</p>
              </div>
              <div>
                <p className="metric text-4xl font-bold text-primary md:text-5xl">
                  {t("landing.metric2Value")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("landing.metric2Label")}</p>
              </div>
              <div>
                <p className="metric text-4xl font-bold text-primary md:text-5xl">
                  {t("landing.metric3Value")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("landing.metric3Label")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section id="how-it-works" className="fade-in-section section-gap">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="max-w-xl">
              <p className="eyebrow">{t("landing.stepsEyebrow")}</p>
              <h2 className="headline-lg mt-3">{t("landing.stepsTitle")}</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">{t("landing.stepsDescription")}</p>
            </div>
            <div className="grid gap-4">
              {steps.map((step) => (
                <article key={step.number} className="card card-interactive-glow border border-border/40 flex flex-col gap-4 p-6 md:flex-row md:items-start md:gap-6">
                  <div className="metric text-3xl font-bold text-primary leading-none">{step.number}</div>
                  <div>
                    <p className="headline-md font-medium text-foreground">{step.title}</p>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground md:text-base">{step.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="fade-in-section section-gap">
          <div className="grid gap-5 lg:grid-cols-2">
            {useCases.map((useCase) => (
              <article key={useCase.title} className="card-muted rounded-[1.5rem] border border-border/10 p-6 md:p-8 transition duration-300 hover:border-primary/20">
                <p className="eyebrow">{t("landing.useCaseEyebrow")}</p>
                <h2 className="headline-md mt-3 font-semibold">{useCase.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">{useCase.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="fade-in-section section-gap">
          <div className="max-w-2xl">
            <p className="eyebrow">{t("landing.testimonialsEyebrow")}</p>
            <h2 className="headline-lg mt-3">{t("landing.testimonialsTitle")}</h2>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { quote: t("landing.testimonial1Quote"), name: t("landing.testimonial1Name"), role: t("landing.testimonial1Role") },
              { quote: t("landing.testimonial2Quote"), name: t("landing.testimonial2Name"), role: t("landing.testimonial2Role") },
              { quote: t("landing.testimonial3Quote"), name: t("landing.testimonial3Name"), role: t("landing.testimonial3Role") },
            ].map((tItem) => (
              <article key={tItem.name} className="card card-interactive-glow flex flex-col border border-border/40 p-6">
                {/* Quote icon */}
                <svg className="mb-4 h-6 w-6 text-primary/40" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                </svg>
                <blockquote className="flex-1 text-sm leading-7 text-muted-foreground">
                  {tItem.quote}
                </blockquote>
                <div className="mt-6 border-t border-border/30 pt-4">
                  <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                    {tItem.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{tItem.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="fade-in-section section-gap">
          <div className="max-w-2xl">
            <p className="eyebrow">{t("landing.pricingEyebrow")}</p>
            <h2 className="headline-lg mt-3">{t("landing.pricingTitle")}</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
              {t("landing.pricingDescription")}
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:gap-8">
            {/* Free Plan */}
            <div className="card glass-pricing-card border border-border/40 p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/30">
              <div>
                <p className="headline-md font-semibold text-foreground">{t("landing.pricingFreeTitle")}</p>
                <p className="mt-3 metric text-3xl font-semibold text-foreground">{t("landing.pricingFreePrice")}</p>
                <ul className="mt-8 space-y-3.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary font-bold">✓</span> {t("landing.pricingFreeBullet1")}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary font-bold">✓</span> {t("landing.pricingFreeBullet2")}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary font-bold">✓</span> {t("landing.pricingFreeBullet3")}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary font-bold">✓</span> {t("landing.pricingFreeBullet4")}
                  </li>
                </ul>
                <div className="mt-8">
                  <Button href="/register" variant="soft" className="w-full rounded-full">
                    {t("landing.pricingFreeCta")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Premium Plan (Featured) */}
            <div className="card relative glass-pricing-card border-2 border-primary/50 p-6 md:p-8 flex flex-col justify-between shadow-float scale-[1.01] md:scale-[1.03] transition-all duration-300 hover:border-primary/80">
              <span className="absolute -top-3.5 right-6 rounded-full bg-primary px-4 py-1 text-xs font-semibold tracking-wider text-white shadow-sm">
                {t("landing.pricingPremiumBadge")}
              </span>
              <div>
                <p className="headline-md font-semibold text-foreground">{t("landing.pricingPremiumTitle")}</p>
                <p className="mt-3 metric text-3xl font-bold text-primary-strong">{t("landing.pricingPremiumPrice")}</p>
                <span className="mt-1 inline-block text-xs font-label uppercase tracking-wider text-primary font-semibold">{t("landing.pricingAnnualHighlight")}</span>
                <ul className="mt-8 space-y-3.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2.5 font-medium text-foreground/90">
                    <span className="text-primary font-bold">✓</span> {t("landing.pricingPremiumBullet1")}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary font-bold">✓</span> {t("landing.pricingPremiumBullet2")}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary font-bold">✓</span> {t("landing.pricingPremiumBullet3")}
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-primary font-bold">✓</span> {t("landing.pricingPremiumBullet4")}
                  </li>
                </ul>
                <div className="mt-8">
                  <Button href="/register" className="w-full rounded-full">
                    {t("landing.pricingPremiumCta")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Pricing Comparison Table */}
            <div className="mt-12 fade-in-section">
              <h3 className="headline-md font-semibold text-center mb-8">{t("landing.pricingCompareTitle")}</h3>
              <div className="overflow-hidden rounded-[1.5rem] border border-border/40 bg-card p-1">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="px-5 py-4 text-left font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {t("landing.pricingCompareFeature")}
                      </th>
                      <th className="px-5 py-4 text-center font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">
                        {t("landing.pricingCompareFree")}
                      </th>
                      <th className="px-5 py-4 text-center font-label text-xs uppercase tracking-[0.14em] bg-primary-soft/40 rounded-t-lg">
                        <span className="text-primary-strong">{t("landing.pricingComparePremium")}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: t("landing.pricingCompareWalletCount"), free: t("landing.pricingCompareWalletCountFree"), premium: t("landing.pricingCompareWalletCountPremium") },
                      { feature: t("landing.pricingCompareMembers"), free: t("landing.pricingCompareMembersFree"), premium: t("landing.pricingCompareMembersPremium") },
                      { feature: t("landing.pricingCompareAiDaily"), free: t("landing.pricingCompareAiDailyFree"), premium: t("landing.pricingCompareAiDailyPremium") },
                      { feature: t("landing.pricingCompareReportHistory"), free: t("landing.pricingCompareReportHistoryFree"), premium: t("landing.pricingCompareReportHistoryPremium") },
                      { feature: t("landing.pricingCompareExport"), free: t("landing.pricingCompareExportFree"), premium: t("landing.pricingCompareExportPremium") },
                      { feature: t("landing.pricingCompareSharedWallets"), free: t("landing.pricingCompareSharedWalletsFree"), premium: t("landing.pricingCompareSharedWalletsPremium") },
                    ].map((row, i) => (
                      <tr key={row.feature} className={i % 2 === 0 ? "bg-muted/40" : ""}>
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{row.feature}</td>
                        <td className="px-5 py-3 text-center text-sm text-muted-foreground">{row.free}</td>
                        <td className="px-5 py-3 text-center text-sm font-medium text-primary-strong bg-primary-soft/20">
                          {row.premium}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="fade-in-section section-gap">
          <div className="max-w-2xl">
            <h2 className="headline-lg">{t("landing.faqTitle")}</h2>
          </div>
          <div className="mt-6 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.question} className="card border border-border/40 group cursor-pointer transition-all duration-200 hover:border-primary/25">
                <summary className="headline-md list-none px-6 py-4 font-medium text-foreground flex justify-between items-center">
                  <span>{faq.question}</span>
                  <span className="text-muted-foreground/60 transition-transform duration-200 group-open:rotate-180">▼</span>
                </summary>
                <p className="px-6 pb-5 text-sm leading-7 text-muted-foreground border-t border-border/20 pt-4 mt-1">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="fade-in-section section-gap">
          <div className="overflow-hidden rounded-[2.5rem] bg-primary px-6 py-10 text-white shadow-float md:px-12 md:py-12 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_40%)]" />
            <div className="max-w-3xl relative z-10">
              <p className="eyebrow text-white/70">{t("landing.ctaEyebrow")}</p>
              <h2 className="headline-lg mt-3 text-white font-semibold leading-snug">{t("landing.ctaTitle")}</h2>
              <p className="mt-4 text-base leading-7 text-white/80 md:text-lg">{t("landing.ctaDescription")}</p>
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
                <Button href="/register" className="bg-white text-primary-strong hover:bg-[#f4f1e5] px-6 py-3 font-semibold">{t("landing.ctaRegister")}</Button>
                <Button href="/login" variant="ghost" className="border-white/30 text-white hover:bg-white/10 px-6 py-3 font-semibold">{t("landing.ctaLogin")}</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <LandingFooter />
      </main>
    </>
  );
}

