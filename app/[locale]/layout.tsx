import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { TimezoneProvider } from "@/components/providers/timezone-provider";
import { defaultLocale, getTranslator, isLocale, locales, localizePath, type AppLocale } from "@/lib/i18n";
import { resolveTimezone, TZ_COOKIE_NAME } from "@/lib/timezone";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = (isLocale(localeParam) ? localeParam : defaultLocale) as AppLocale;
  const t = getTranslator(locale);

  return {
    title: {
      default: `${t("app.name")} | ${t("app.tagline")}`,
      template: `%s | ${t("app.name")}`
    },
    description: t("app.description"),
    alternates: {
      languages: {
        id: localizePath("id", "/"),
        en: localizePath("en", "/")
      }
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = isLocale(localeParam) ? localeParam : defaultLocale;

  // Baca timezone dari cookie buat SSR consistency
  const cookieStore = await cookies();
  const timezone = resolveTimezone(cookieStore.get(TZ_COOKIE_NAME)?.value ?? null);

  return (
    <LocaleProvider locale={locale}>
      <TimezoneProvider initialTimezone={timezone}>{children}</TimezoneProvider>
    </LocaleProvider>
  );
}
