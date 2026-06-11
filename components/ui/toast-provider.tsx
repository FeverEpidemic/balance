"use client";

import { toast as sonnerToast } from "sonner";
import { createContext, useContext, useMemo, type ReactNode } from "react";

type ToastInput = {
  description: string;
  tone?: "error" | "info" | "success";
};

type ToastContextValue = {
  dismissToast: (id: string | number) => void;
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const value = useMemo<ToastContextValue>(
    () => ({
      dismissToast: (id) => sonnerToast.dismiss(id),
      pushToast: ({ description, tone = "info" }) => {
        if (tone === "success") {
          sonnerToast.success(description);
        } else if (tone === "error") {
          sonnerToast.error(description);
        } else {
          sonnerToast.info(description);
        }
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
