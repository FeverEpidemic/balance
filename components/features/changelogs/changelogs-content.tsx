"use client";

import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { changelogs } from "@/lib/changelogs";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { formatShortDate } from "@/lib/utils";
import type { getShellData } from "@/lib/data";

type ShellData = Awaited<ReturnType<typeof getShellData>>;

export function ChangelogsContent({
  shell,
  locale
}: {
  shell: ShellData;
  locale: AppLocale;
}) {
  const t = getTranslator(locale);

  return (
    <AppShell
      currentPath="/changelogs"
      title={t("changelogs.title")}
      subtitle={t("changelogs.subtitle")}
      userName={shell.userName}
      walletCount={shell.walletCount}
      budgetCount={shell.budgetCount}
      memberCount={shell.memberCount}
      primaryWalletId={shell.primaryWalletId}
    >
      <section className="card">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("common.changelogs")}</p>
          <h3 className="headline-md mt-2">{t("changelogs.title")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("changelogs.description")}</p>
        </div>

        <div className="mt-6 space-y-4">
          {changelogs.length === 0 ? (
            <EmptyState title={t("changelogs.emptyTitle")} description={t("changelogs.emptyDescription")} />
          ) : null}

          {changelogs.map((entry) => (
            <article key={entry.version} className="rounded-[1.25rem] border border-border bg-card p-4 shadow-serene sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-3 py-1 font-label text-xs text-[var(--button-primary-text)]">
                  {t("changelogs.versionLabel")} {entry.version}
                </span>
                <span className="text-sm text-muted-foreground">{formatShortDate(entry.date, locale)}</span>
              </div>
              <h4 className="headline-md mt-4">{entry.title}</h4>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{entry.description}</p>
              <div className="mt-5 rounded-[1.25rem] bg-muted p-4">
                <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {t("changelogs.featuresLabel")}
                </p>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {entry.features.map((feature) => (
                    <li key={`${entry.version}-${feature.text}`} className="flex gap-3 text-sm text-foreground">
                      <span aria-hidden="true" className="mt-0.5 shrink-0">
                        {feature.icon}
                      </span>
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
