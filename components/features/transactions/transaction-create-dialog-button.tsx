"use client";

import { useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TransactionCreateContext } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";
import { TransactionCreateForm } from "@/components/features/transactions/transaction-create-form";

export function TransactionCreateDialogButton({
  context,
  label,
  iconOnly
}: {
  context: TransactionCreateContext;
  label: string;
  iconOnly?: boolean;
}) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={iconOnly ? "primary" : "soft"}
        className={iconOnly
          ? "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-[var(--button-primary-text)] shadow-float transition hover:bg-primary-hover active:scale-95"
          : "min-h-[2.75rem] gap-2 rounded-full border border-border bg-overlay px-3 shadow-none hover:shadow-none"
        }
        aria-label={label}
      >
        {iconOnly ? (
          <AppIcon name="plus" className="h-6 w-6" tone="inherit" />
        ) : (
          <>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card ring-1 ring-inset ring-border">
              <AppIcon name="plus" className="h-4 w-4" tone="primary" />
            </span>
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("transactions.createDialogTitle")}</DialogTitle>
            <DialogDescription>{t("transactions.createDialogDescription", { walletName: context.walletName })}</DialogDescription>
          </DialogHeader>
          <TransactionCreateForm context={context} className="mt-5 grid min-w-0 gap-4" onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
