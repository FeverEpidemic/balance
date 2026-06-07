import type { Metadata } from "next";
import { getLocaleTag, getTranslator, resolveLocale } from "@/lib/i18n";

const lastUpdatedAt = new Date("2026-06-08T00:00:00+07:00");
const sectionKeys = [
  "dataWeCollect",
  "howWeUse",
  "dataStorage",
  "thirdParty",
  "cookies",
  "userRights",
  "contact"
] as const;

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);

  return {
    title: t("privacy.title"),
    description: t("privacy.intro")
  };
}

export default async function PrivacyPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  const formattedDate = new Intl.DateTimeFormat(getLocaleTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(lastUpdatedAt);

  return (
    <main className="page-wrap py-8 md:py-12">
      <section className="glass-panel-strong mx-auto max-w-4xl rounded-[2rem] p-6 shadow-float md:p-10">
        <div className="max-w-3xl">
          <p className="eyebrow">{t("common.privacy")}</p>
          <h1 className="headline-lg mt-4">{t("privacy.title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground md:text-base">
            {t("privacy.lastUpdated", { date: formattedDate })}
          </p>
          <p className="mt-6 text-sm leading-7 text-muted-foreground md:text-base">
            {t("privacy.intro")}
          </p>
        </div>

        <div className="mt-10 space-y-6">
          {sectionKeys.map((sectionKey) => (
            <article key={sectionKey} className="card">
              <h2 className="headline-md">
                {t(`privacy.sections.${sectionKey}.heading`)}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                {t(`privacy.sections.${sectionKey}.body`)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
