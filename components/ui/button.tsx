import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const variants = {
  primary:
    "bg-primary text-white shadow-serene hover:bg-primary-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_28px_-12px_rgba(45,54,39,0.45)]",
  ghost: "border border-border bg-transparent text-foreground hover:bg-muted",
  soft: "bg-primary-soft text-primary-strong hover:bg-[#d3dbad]"
};

type ButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  variant?: keyof typeof variants;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md";
};

export function Button({ children, className, href, variant = "primary", type, size = "md" }: ButtonProps) {
  const styles = cn(
    "inline-flex items-center justify-center rounded-lg font-label text-sm font-medium transition",
    size === "sm" ? "px-3 py-2" : "px-4 py-3",
    variants[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
      </Link>
    );
  }

  return <button type={type} className={styles}>{children}</button>;
}
