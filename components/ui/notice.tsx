import { Alert } from "@/components/ui/shadcn/alert";
import type { ReactNode } from "react";

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const tones = {
    info: "theme-primary-pill text-primary-strong",
    error: "theme-danger-pill",
    success: "theme-success-pill"
  };

  return (
    <Alert className={`rounded-xl border px-4 py-3 text-sm leading-6 ${tones[tone]}`}>
      {children}
    </Alert>
  );
}
