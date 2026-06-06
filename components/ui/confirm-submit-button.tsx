"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)]",
  ghost: "border border-border bg-transparent text-foreground hover:bg-muted",
  soft: "bg-primary-soft text-primary-strong hover:bg-[var(--primary-soft-strong)]"
};

export function ConfirmSubmitButton({
  cancelLabel,
  children,
  className,
  confirmLabel,
  confirmMessage,
  confirmTitle,
  pendingText,
  variant = "ghost"
}: {
  cancelLabel?: string;
  children: string;
  className?: string;
  confirmLabel?: string;
  confirmMessage: string;
  confirmTitle?: string;
  pendingText?: string;
  variant?: keyof typeof variants;
}) {
  const { pending } = useFormStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [formElement, setFormElement] = useState<HTMLFormElement | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={(event) => {
          setFormElement(event.currentTarget.form);
          setIsOpen(true);
        }}
        className={cn(
          "inline-flex min-w-0 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center font-label text-sm font-medium leading-tight transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
          "min-h-[3.25rem]",
          variants[variant],
          className
        )}
      >
        {pending ? pendingText ?? "Memproses..." : children}
      </button>
      <ConfirmDialog
        open={isOpen}
        title={confirmTitle}
        description={confirmMessage}
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        confirmTone="danger"
        onCancel={() => {
          setIsOpen(false);
          setFormElement(null);
        }}
        onConfirm={() => {
          setIsOpen(false);
          formElement?.requestSubmit();
          setFormElement(null);
        }}
      />
    </>
  );
}
