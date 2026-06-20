import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import { getTranslator, resolveLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n";

export default async function NotFoundPage(props: {
  params?: Promise<{ locale?: string }>;
}) {
  let localeParam: string | undefined;

  try {
    const resolvedParams = props.params ? await props.params : undefined;
    localeParam = resolvedParams?.locale;
  } catch {
    // Abaikan jika gagal membaca params
  }

  if (!localeParam) {
    try {
      const cookieStore = await cookies();
      localeParam = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    } catch {
      // Abaikan jika cookies() dipanggil saat static generation
    }
  }

  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);


  return (
    <main className="page-wrap flex min-h-screen items-center py-10">
      <section className="glass-panel-strong mx-auto w-full max-w-md rounded-[2rem] p-6 shadow-float md:p-10">
        <p className="eyebrow">{t("notFound.eyebrow")}</p>
        <h1 className="headline-lg mt-4">{t("notFound.title")}</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {t("notFound.description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/">{t("notFound.goHome")}</Button>
          <Button href="/login" variant="ghost">
            {t("notFound.goLogin")}
          </Button>
        </div>
      </section>
    </main>
  );
}
