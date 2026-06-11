import { cn } from "@/lib/utils";
import { Badge as ShadcnBadge } from "@/components/ui/shadcn/badge";

const toneMap = {
  default: "theme-primary-pill",
  success: "theme-success-pill",
  danger: "theme-danger-pill"
} as const;

export function Badge({ children, tone = "default", className }: { children: string; className?: string; tone?: "default" | "success" | "danger" }) {
  return (
    <ShadcnBadge
      variant="outline"
      className={cn(
        "rounded-full border px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-transparent",
        toneMap[tone],
        className
      )}
    >
      {children}
    </ShadcnBadge>
  );
}
