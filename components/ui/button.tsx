"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/shadcn/button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variantMap = {
  primary: "default" as const,
  ghost: "outline" as const,
  soft: "secondary" as const
};

const sereneStyles: Record<string, string> = {
  primary:
    "rounded-xl shadow-serene hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)]",
  ghost: "rounded-xl border-border bg-transparent text-foreground hover:bg-muted hover:text-foreground",
  soft: "rounded-xl bg-primary-soft text-primary-strong hover:bg-[var(--primary-soft-strong)] hover:text-primary-strong"
};

type ButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void | Promise<void>;
  variant?: "primary" | "ghost" | "soft";
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md";
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

export function Button({ children, className, href, onClick, variant = "primary", type, size = "md", disabled }: ButtonProps) {
  const locale = useLocale();
  const shadcnVariant = variantMap[variant];
  const sereneClass = sereneStyles[variant];

  const styles = cn(
    "font-label text-sm font-medium leading-tight transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px disabled:pointer-events-none disabled:opacity-60 inline-flex items-center justify-center gap-2",
    size === "sm" ? "min-h-[2.75rem] px-3 py-2" : "min-h-[3.25rem] px-4 py-3",
    sereneClass,
    className
  );

  if (href) {
    return (
      <Link href={localizePath(locale, href)} className={styles}>
        {children}
      </Link>
    );
  }

  return (
    <ShadcnButton
      variant={shadcnVariant}
      className={styles}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </ShadcnButton>
  );
}
