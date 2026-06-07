"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function WalletTabs({ walletId, active }: { walletId: string; active: string }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const tabs = [
    { slug: "", label: t("common.overview") },
    { slug: "/transactions", label: t("common.transactions") },
    { slug: "/savings", label: t("common.savings") },
    { slug: "/recurring", label: t("common.automatic") },
    { slug: "/budgets", label: t("common.budgets") },
    { slug: "/reports", label: t("common.reports") },
    { slug: "/members", label: t("common.members") },
    { slug: "/settlements", label: t("common.settlements") },
    { slug: "/templates", label: t("common.templates") }
  ];
  return (
    <div className="mb-4 overflow-x-auto">
      <div className="glass-panel inline-flex min-w-full gap-2 rounded-2xl p-2">
        {tabs.map((tab) => {
          const href = `/wallets/${walletId}${tab.slug}`;
          return (
            <Link
              key={href}
              href={localizePath(locale, href)}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-2 font-label text-xs font-semibold uppercase tracking-[0.12em] transition sm:px-4 sm:py-3 sm:text-sm sm:normal-case sm:tracking-[0.02em]",
                active === href ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
