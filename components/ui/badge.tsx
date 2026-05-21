import { cn } from "@/lib/utils";

export function Badge({ children, tone = "default" }: { children: string; tone?: "default" | "success" | "danger" }) {
  const tones = {
    default: "bg-[rgba(89,95,61,0.1)] text-primary-strong",
    success: "bg-[rgba(91,143,98,0.12)] text-success",
    danger: "bg-[rgba(180,94,94,0.12)] text-danger"
  };

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 font-label text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}
