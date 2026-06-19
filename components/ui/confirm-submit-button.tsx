"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/shadcn/button";

const sereneVariants: Record<string, string> = {
  primary:
    "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)] rounded-xl",
  ghost: "rounded-xl border-border bg-transparent text-foreground hover:bg-muted",
  soft: "rounded-xl bg-primary-soft text-primary-strong hover:bg-[var(--primary-soft-strong)]"
};

const shadcnVariantMap: Record<string, "default" | "outline" | "secondary"> = {
  primary: "default",
  ghost: "outline",
  soft: "secondary"
};

export function ConfirmSubmitButton({
  cancelLabel,
  children,
  className,
  confirmLabel,
  confirmMessage,
  confirmTitle,
  pendingText,
  variant = "ghost",
  onClick
}: {
  cancelLabel?: string;
  children: string;
  className?: string;
  confirmLabel?: string;
  confirmMessage: string;
  confirmTitle?: string;
  pendingText?: string;
  variant?: "primary" | "ghost" | "soft";
  onClick?: () => void;
}) {
  const { pending } = useFormStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [formElement, setFormElement] = useState<HTMLFormElement | null>(null);

  return (
    <>
      <ShadcnButton
        type="button"
        disabled={pending}
        variant={shadcnVariantMap[variant]}
        onClick={(event) => {
          setFormElement(event.currentTarget.form);
          setIsOpen(true);
        }}
        className={cn(
          "font-label text-sm font-medium leading-tight transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
          "min-h-[3.25rem]",
          sereneVariants[variant],
          className
        )}
      >
        {pending ? pendingText ?? "Memproses..." : children}
      </ShadcnButton>
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
          setFormElement(null);
          if (onClick) {
            onClick();
          } else {
            formElement?.requestSubmit();
          }
        }}
      />
    </>
  );
}
