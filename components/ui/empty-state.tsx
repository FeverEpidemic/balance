"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type EmptyStateIllustration = "transactions" | "dashboard" | "categories";

function EmptyStateIllustrationSvg({ type }: { type: EmptyStateIllustration }) {
  if (type === "transactions") {
    // Wallet SVG
    return (
      <svg
        viewBox="0 0 120 80"
        fill="none"
        className="mx-auto h-24 w-36 text-muted-foreground/30"
        aria-hidden
      >
        <rect x="10" y="20" width="100" height="55" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <rect x="30" y="35" width="40" height="26" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="80" cy="48" r="5" fill="currentColor" opacity="0.5" />
        <path d="M25 12 L95 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M35 5 L85 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      </svg>
    );
  }

  if (type === "dashboard") {
    // Chart/bar chart SVG
    return (
      <svg
        viewBox="0 0 120 80"
        fill="none"
        className="mx-auto h-24 w-36 text-muted-foreground/30"
        aria-hidden
      >
        <rect x="20" y="55" width="15" height="20" rx="2" fill="currentColor" opacity="0.2" />
        <rect x="40" y="40" width="15" height="35" rx="2" fill="currentColor" opacity="0.35" />
        <rect x="60" y="25" width="15" height="50" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="80" y="35" width="15" height="40" rx="2" fill="currentColor" opacity="0.35" />
        <line x1="15" y1="58" x2="105" y2="58" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        <line x1="15" y1="35" x2="105" y2="35" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.15" />
      </svg>
    );
  }

  if (type === "categories") {
    // Tags SVG
    return (
      <svg
        viewBox="0 0 120 80"
        fill="none"
        className="mx-auto h-24 w-36 text-muted-foreground/30"
        aria-hidden
      >
        <path
          d="M30 58 L30 25 C30 22 31 20 34 20 L55 20 L70 40 L55 58 Z"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          opacity="0.5"
        />
        <circle cx="42" cy="30" r="3" fill="currentColor" opacity="0.5" />
        <path
          d="M60 30 L90 30 M60 38 L85 38 M60 46 L78 46"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.2"
        />
        <path
          d="M30 58 L95 58"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>
    );
  }

  return null;
}

export function EmptyState({
  title,
  description,
  illustration,
}: {
  title: string;
  description: string;
  illustration?: EmptyStateIllustration;
}) {
  const locale = useLocale();
  const t = getTranslator(locale);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-overlay px-5 py-8 text-center">
      {illustration ? (
        <div className="mb-4">
          <EmptyStateIllustrationSvg type={illustration} />
        </div>
      ) : null}
      <p className="eyebrow text-primary-strong/80">{t("emptyState.eyebrow")}</p>
      <p className="mt-3 font-display text-lg">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
