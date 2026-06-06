"use client";

import { useEffect, useId } from "react";
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

const confirmToneStyles = {
  danger: "bg-danger text-white hover:opacity-90",
  primary:
    "bg-primary text-white shadow-serene hover:bg-primary-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)]"
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
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="true"
      className="theme-overlay fixed inset-0 z-50 flex items-end justify-center p-4 backdrop-blur-[2px] sm:items-center"
      role="dialog"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-[1.75rem] border border-border bg-card p-5 shadow-float sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="theme-primary-pill inline-flex rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.14em]">
          Konfirmasi
        </div>
        <h2 id={titleId} className="mt-4 font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-border bg-overlay px-4 py-3 text-center font-label text-sm font-medium text-foreground transition duration-150 hover:bg-card focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex min-h-[3rem] items-center justify-center rounded-xl px-4 py-3 text-center font-label text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]",
              confirmToneStyles[confirmTone]
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
