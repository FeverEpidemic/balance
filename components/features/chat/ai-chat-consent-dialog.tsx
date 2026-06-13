"use client";

import Link from "next/link";
import { useState } from "react";
import { acceptAiChatConsentAndEnable } from "@/app/actions/ai-compliance";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AppLocale } from "@/lib/i18n";
import { getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type AiChatConsentDialogProps = {
  locale: AppLocale;
  triggerLabel: string;
  triggerVariant?: "primary" | "ghost" | "soft";
  triggerClassName?: string;
  titleOverride?: string;
  descriptionOverride?: string;
};

export function AiChatConsentDialog({
  locale,
  triggerLabel,
  triggerVariant = "primary",
  triggerClassName,
  titleOverride,
  descriptionOverride
}: AiChatConsentDialogProps) {
  const [open, setOpen] = useState(false);
  const t = getTranslator(locale);
  const triggerStyles = cn(
    "inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-xl font-label text-sm font-medium leading-tight transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px",
    triggerVariant === "primary"
      ? "bg-primary px-4 py-3 text-[var(--button-primary-text)] shadow-serene hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)]"
      : triggerVariant === "soft"
        ? "bg-primary-soft px-4 py-3 text-primary-strong hover:bg-[var(--primary-soft-strong)]"
        : "border border-border bg-transparent px-4 py-3 text-foreground hover:bg-muted hover:text-foreground",
    triggerClassName
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={triggerStyles}>
          {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleOverride ?? t("chat.consentDialogTitle")}</DialogTitle>
          <DialogDescription>{descriptionOverride ?? t("chat.consentDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
          <p>{t("chat.consentDialogIntro")}</p>
          <ul className="space-y-2 rounded-[1rem] border border-border bg-muted/60 p-4 text-foreground">
            <li>{t("chat.consentDialogPoint1")}</li>
            <li>{t("chat.consentDialogPoint2")}</li>
            <li>{t("chat.consentDialogPoint3")}</li>
            <li>{t("chat.consentDialogPoint4")}</li>
          </ul>
          <p>{t("chat.consentDialogOutro")}</p>
          <Link
            href={localizePath(locale, "/privacy")}
            className="inline-flex text-sm font-medium text-primary hover:text-primary-strong"
          >
            {t("chat.consentDialogPrivacyLink")}
          </Link>
        </div>

        <ActionForm
          action={acceptAiChatConsentAndEnable}
          onSuccess={() => setOpen(false)}
        >
          {({ pending }) => (
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? t("chat.consentDialogAcceptPending") : t("chat.consentDialogAccept")}
              </Button>
            </DialogFooter>
          )}
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
