import type { ReactNode } from "react";

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const tones = {
    info: "border-[rgba(89,95,61,0.12)] bg-[rgba(89,95,61,0.08)] text-primary-strong",
    error: "border-[rgba(180,94,94,0.16)] bg-[rgba(180,94,94,0.12)] text-danger",
    success: "border-[rgba(91,143,98,0.16)] bg-[rgba(91,143,98,0.12)] text-success"
  };

  return <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tones[tone]}`}>{children}</div>;
}
