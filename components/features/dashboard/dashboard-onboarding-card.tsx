"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, dismissOnboarding } from "@/app/actions/onboarding";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { DashboardOnboarding } from "@/lib/data";

export function DashboardOnboardingCard({ onboarding }: { onboarding: DashboardOnboarding }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const hasTriggeredAutoCompleteRef = useRef(false);

  useEffect(() => {
    if (!onboarding.isVisible || onboarding.state !== "completed" || hasTriggeredAutoCompleteRef.current) {
      return;
    }

    hasTriggeredAutoCompleteRef.current = true;
    setIsAutoCompleting(true);

    const timeoutId = window.setTimeout(() => {
      startTransition(async () => {
        await completeOnboarding();
        router.refresh();
      });
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onboarding.isVisible, onboarding.state, router]);

  if (!onboarding.isVisible) {
    return null;
  }

  const progressWidth = onboarding.totalSteps > 0 ? `${(onboarding.completedSteps / onboarding.totalSteps) * 100}%` : "0%";

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissOnboarding();
      router.refresh();
    });
  };

  return (
    <section className="card mb-4 overflow-hidden shadow-float">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("dashboard.onboardingEyebrow")}</p>
          <h3 className="headline-md mt-2">
            {onboarding.state === "completed" ? t("dashboard.onboardingCompletedTitle") : t("dashboard.onboardingActiveTitle")}
          </h3>
          <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
            {onboarding.state === "completed"
              ? t("dashboard.onboardingCompletedDescription")
              : t("dashboard.onboardingActiveDescription")}
          </p>
        </div>
        <div className="glass-panel min-w-[13rem] rounded-[1.25rem] p-4">
          <p className="font-label text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("dashboard.onboardingProgressLabel")}</p>
          <p className="metric mt-3 text-2xl">
            {onboarding.completedSteps}/{onboarding.totalSteps}
          </p>
          <div className="mt-4 h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary transition-[width]" style={{ width: progressWidth }} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {onboarding.state === "completed" ? t("dashboard.onboardingCompletedProgress") : t("dashboard.onboardingActiveProgress")}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {onboarding.steps.map((step, index) => (
          <article
            key={step.id}
            className={cn(
              "rounded-[1.25rem] border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)] transition",
              step.isComplete ? "border-[rgba(89,95,61,0.2)] bg-primary-soft/55" : "glass-panel"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-full bg-card px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-strong">
                {t("dashboard.onboardingStepLabel", { count: index + 1 })}
              </div>
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm",
                  step.isComplete
                    ? "border-[rgba(89,95,61,0.16)] bg-primary text-white"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                {step.isComplete ? "✓" : index + 1}
              </span>
            </div>
            <h4 className="mt-4 font-display text-lg text-foreground">{step.title}</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            <div className="mt-4">
              <Button href={step.href} variant={step.isComplete ? "ghost" : "primary"} size="sm" className="w-full">
                {step.ctaLabel}
              </Button>
            </div>
          </article>
        ))}
      </div>

      {onboarding.state === "active" ? (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isPending}
            className="rounded-full px-3 py-2 font-label text-xs text-muted-foreground transition hover:bg-muted disabled:opacity-60"
          >
            {t("dashboard.onboardingSkip")}
          </button>
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted-foreground">
          {isAutoCompleting || isPending ? t("dashboard.onboardingAutoCompleting") : t("dashboard.onboardingReady")}
        </p>
      )}
    </section>
  );
}
