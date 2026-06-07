"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";

export function EmptyState({ title, description }: { title: string; description: string }) {
  const locale = useLocale();
  const t = getTranslator(locale);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-overlay px-5 py-8 text-center">
      <p className="eyebrow text-primary-strong/80">{t("emptyState.eyebrow")}</p>
      <p className="mt-3 font-display text-lg">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
