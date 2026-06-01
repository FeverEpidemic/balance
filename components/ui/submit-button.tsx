"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary text-white shadow-serene hover:bg-primary-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)]",
  ghost: "border border-border bg-transparent text-foreground hover:bg-muted",
  soft: "bg-primary-soft text-primary-strong hover:bg-[#d3dbad]"
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
        "inline-flex items-center justify-center rounded-lg px-4 py-3 font-label text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
    >
      {pending ? pendingText ?? "Memproses..." : children}
    </button>
  );
}
