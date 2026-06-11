"use client";

import { useFormStatus } from "react-dom";
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

export function SubmitButton({
  children,
  className,
  pendingText,
  variant = "primary"
}: {
  children: string;
  className?: string;
  pendingText?: string;
  variant?: "primary" | "ghost" | "soft";
}) {
  const { pending } = useFormStatus();

  return (
    <ShadcnButton
      type="submit"
      disabled={pending}
      variant={shadcnVariantMap[variant]}
      className={cn(
        "font-label text-sm font-medium leading-tight transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
        "min-h-[3.25rem]",
        sereneVariants[variant],
        className
      )}
    >
      {pending ? pendingText ?? "Memproses..." : children}
    </ShadcnButton>
  );
}
