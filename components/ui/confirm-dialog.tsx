"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/shadcn/alert-dialog";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  confirmTone?: "danger" | "primary";
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title?: string;
};

const actionStyles: Record<string, string> = {
  danger:
    "bg-danger text-white hover:bg-danger/90 rounded-xl font-label text-sm font-medium",
  primary:
    "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)] rounded-xl font-label text-sm font-medium"
};

export function ConfirmDialog({
  cancelLabel = "Batal",
  confirmLabel = "Lanjutkan",
  confirmTone = "danger",
  description,
  onCancel,
  onConfirm,
  open,
  title = "Konfirmasi aksi"
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <AlertDialogContent
        className="w-[min(92vw,38rem)] rounded-[1.75rem] border-border bg-card p-5 shadow-float sm:p-6"
      >
        <div className="theme-primary-pill inline-flex rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.14em]">
          Konfirmasi
        </div>
        <AlertDialogTitle className="mt-4 font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </AlertDialogTitle>
        <AlertDialogDescription className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </AlertDialogDescription>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AlertDialogCancel
            className={cn(
              "mt-0 inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-border bg-overlay px-4 py-3 text-center font-label text-sm font-medium text-foreground transition duration-150 hover:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] sm:mt-0"
            )}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "inline-flex min-h-[3rem] items-center justify-center rounded-xl px-4 py-3 text-center font-label text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]",
              actionStyles[confirmTone]
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
