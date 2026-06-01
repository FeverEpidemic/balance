import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default" }: { children: string; tone?: "default" | "success" | "danger" }) {
  const tones = {
    default: "border border-[rgba(89,95,61,0.12)] bg-[rgba(89,95,61,0.1)] text-primary-strong",
    success: "border border-[rgba(91,143,98,0.16)] bg-[rgba(91,143,98,0.12)] text-success",
    danger: "border border-[rgba(180,94,94,0.16)] bg-[rgba(180,94,94,0.12)] text-danger"
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]", tones[tone])}>
      {children}
    </span>
  );
}
