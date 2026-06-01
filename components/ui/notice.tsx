import type { ReactNode } from "react";

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const tones = {
    info: "bg-[rgba(89,95,61,0.08)] text-primary-strong",
    error: "bg-[rgba(180,94,94,0.12)] text-danger",
    success: "bg-[rgba(91,143,98,0.12)] text-success"
  };

  return <div className={`rounded-xl px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}
