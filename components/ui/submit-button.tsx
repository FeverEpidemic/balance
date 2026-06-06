"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)]",
  ghost: "border border-border bg-transparent text-foreground hover:bg-muted",
  soft: "bg-primary-soft text-primary-strong hover:bg-[var(--primary-soft-strong)]"
};

export function SubmitButton({
  children,
  className,
  pendingText,
  variant = "primary"
}: {
  children: string;
  className?: string;
  pendingText?: string;
  variant?: keyof typeof variants;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex min-w-0 max-w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-center font-label text-sm font-medium leading-tight transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
        "min-h-[3.25rem]",
        variants[variant],
        className
      )}
    >
      {pending ? pendingText ?? "Memproses..." : children}
    </button>
  );
}
