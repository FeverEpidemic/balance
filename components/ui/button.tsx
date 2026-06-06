import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

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
  onClick?: () => void | Promise<void>;
  variant?: keyof typeof variants;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md";
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

export function Button({ children, className, href, onClick, variant = "primary", type, size = "md", disabled }: ButtonProps) {
  const styles = cn(
    "inline-flex min-w-0 max-w-full items-center justify-center gap-2 rounded-xl text-center font-label text-sm font-medium leading-tight transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] active:translate-y-px disabled:pointer-events-none disabled:opacity-60",
    size === "sm" ? "min-h-[2.75rem] px-3 py-2" : "min-h-[3.25rem] px-4 py-3",
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

  return (
    <button type={type} className={styles} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
