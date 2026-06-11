"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n";

export function DashboardAiInsight({ locale }: { locale: AppLocale }) {
  const t = getTranslator(locale);
  const [insight, setInsight] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void fetch("/api/ai/insight")
      .then(async (response) => response.json() as Promise<{ insight?: string }>)
      .then((payload) => {
        if (isMounted) {
          setInsight(payload.insight?.trim() || "");
        }
      })
      .catch(() => {
        if (isMounted) {
          setInsight("");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (insight === "") {
    return null;
  }

  return (
    <section className="mt-4 overflow-hidden rounded-[1.4rem] border border-[color:var(--soft-border)] bg-[linear-gradient(135deg,var(--primary-soft),color-mix(in_srgb,var(--card)_82%,var(--primary-soft)_18%))] p-5 shadow-serene">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-primary-strong">{t("insight.cardEyebrow")}</p>
          <h3 className="mt-2 font-display text-lg font-medium text-foreground sm:text-xl">{t("insight.cardTitle")}</h3>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[color:var(--soft-border)] bg-card/80">
          <AppIcon name="chat" className="h-5 w-5" tone="primary" />
        </span>
      </div>

      {insight === null ? (
        <div className="mt-5 space-y-3">
          <div className="h-4 w-3/4 rounded-full bg-[var(--skeleton-base)]" />
          <div className="h-4 w-full rounded-full bg-[var(--skeleton-base)]" />
          <div className="h-4 w-2/3 rounded-full bg-[var(--skeleton-base)]" />
        </div>
      ) : (
        <p className="mt-5 text-sm leading-7 text-foreground/90" style={{ animation: "page-enter 320ms ease-out" }}>
          {insight}
        </p>
      )}

      <div className="mt-5">
        <Button href="/chat" variant="soft" size="sm" className="rounded-full">
          {t("common.aiAssistant")}
        </Button>
      </div>
    </section>
  );
}
