import { Button } from "@/components/ui/button";
import { getTranslator, resolveLocale } from "@/lib/i18n";

export default async function OfflinePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  return (
    <main className="page-wrap flex min-h-screen items-center py-10">
      <section className="glass-panel-strong mx-auto w-full max-w-2xl rounded-[2rem] p-6 shadow-float md:p-10">
        <p className="eyebrow">{t("offline.eyebrow")}</p>
        <h1 className="headline-lg mt-4 max-w-xl">{t("offline.title")}</h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
          {t("offline.description")}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="card-muted rounded-[1.5rem] p-5">
            <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("offline.tipsTitle")}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("offline.tipsDescription")}
            </p>
          </div>
          <div className="card-muted rounded-[1.5rem] p-5">
            <p className="font-label text-xs uppercase tracking-[0.16em] text-muted-foreground">{t("offline.statusTitle")}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("offline.statusDescription")}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/">{t("offline.tryAgain")}</Button>
          <Button href="/login" variant="ghost">
            {t("offline.openLogin")}
          </Button>
        </div>
      </section>
    </main>
  );
}
