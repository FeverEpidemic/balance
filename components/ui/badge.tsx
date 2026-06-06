import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default" }: { children: string; tone?: "default" | "success" | "danger" }) {
  const tones = {
    default: "theme-primary-pill",
    success: "theme-success-pill",
    danger: "theme-danger-pill"
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]", tones[tone])}>
      {children}
    </span>
  );
}
