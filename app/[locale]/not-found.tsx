import { Button } from "@/components/ui/button";
import { getTranslator, resolveLocale } from "@/lib/i18n";

export default async function NotFoundPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
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
