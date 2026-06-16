"use client";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AppLocale } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n";

const capabilityKeys = [
  "chat.helpCapabilitiesPoint1",
  "chat.helpCapabilitiesPoint2",
  "chat.helpCapabilitiesPoint3",
  "chat.helpCapabilitiesPoint4"
] as const;

const exampleKeys = [
  "chat.helpExample1",
  "chat.helpExample2",
  "chat.helpExample3",
  "chat.helpExample4"
] as const;

const tipKeys = [
  "chat.helpTip1",
  "chat.helpTip2",
  "chat.helpTip3",
  "chat.helpTip4"
] as const;

export function AiChatHelpDialog({ locale }: { locale: AppLocale }) {
  const t = getTranslator(locale);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t("chat.helpTriggerLabel")}
          title={t("chat.helpTriggerLabel")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-serene transition duration-150 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px"
        >
          <AppIcon name="help" className="h-[1.125rem] w-[1.125rem]" tone="inherit" />
          <span className="sr-only">{t("chat.helpTriggerLabel")}</span>
        </button>
      </DialogTrigger>

      <DialogContent className="h-[min(88dvh,44rem)] w-[min(94vw,40rem)] overflow-hidden p-0">
        <div className="grid h-full min-h-0 grid-rows-[auto,minmax(0,1fr),auto]">
          <DialogHeader className="border-b border-border px-5 py-5 sm:px-6 sm:py-6">
            <DialogTitle>{t("chat.helpDialogTitle")}</DialogTitle>
            <DialogDescription>{t("chat.helpDialogDescription")}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 overflow-y-scroll overscroll-contain px-5 py-5 text-sm leading-6 text-muted-foreground [scrollbar-gutter:stable] sm:px-6 sm:py-6">
            <div className="space-y-5">
              <section className="space-y-3">
                <h3 className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">{t("chat.helpCapabilitiesTitle")}</h3>
                <ul className="list-disc space-y-2 rounded-[1rem] border border-border bg-muted/60 p-4 pl-8 text-foreground">
                  {capabilityKeys.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">{t("chat.helpExamplesTitle")}</h3>
                <ul className="space-y-2">
                  {exampleKeys.map((key) => (
                    <li key={key} className="rounded-[1rem] border border-border bg-card px-4 py-3 text-foreground shadow-sm">
                      {t(key)}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-primary-strong">{t("chat.helpTipsTitle")}</h3>
                <ul className="list-disc space-y-2 rounded-[1rem] border border-border bg-muted/60 p-4 pl-8 text-foreground">
                  {tipKeys.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </section>

              <p className="rounded-[1rem] border border-amber-200 bg-amber-50/80 px-4 py-3 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                {t("chat.helpAccuracyNote")}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-0 border-t border-border px-5 py-4 sm:px-6">
            <DialogClose asChild>
              <Button type="button">{t("chat.helpDialogClose")}</Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
