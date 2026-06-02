"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastTone = "error" | "info" | "success";

type ToastInput = {
  description: string;
  tone?: ToastTone;
};

type ToastRecord = ToastInput & {
  id: string;
};

type ToastContextValue = {
  dismissToast: (id: string) => void;
  pushToast: (toast: ToastInput) => void;
};

const TOAST_LIFETIME_MS = 5000;

const toastToneStyles: Record<ToastTone, string> = {
  info: "border-[rgba(89,95,61,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,238,231,0.98))] text-primary-strong",
  error: "border-[rgba(180,94,94,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,238,235,0.98))] text-danger",
  success: "border-[rgba(91,143,98,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(236,245,238,0.98))] text-success"
};

const toastToneLabels: Record<ToastTone, string> = {
  info: "Info",
  error: "Error",
  success: "Berhasil"
};

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastItem({ toast, onDismiss }: { onDismiss: (id: string) => void; toast: ToastRecord }) {
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, TOAST_LIFETIME_MS);

    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.id]);

  return (
    <button
      type="button"
      onClick={() => onDismiss(toast.id)}
      className={cn(
        "toast-enter w-full rounded-[1rem] border p-4 text-left shadow-[0_12px_32px_-16px_rgba(45,54,39,0.28)] backdrop-blur-sm transition duration-150 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(45,54,39,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]",
        toastToneStyles[toast.tone ?? "info"]
      )}
      aria-label={`${toastToneLabels[toast.tone ?? "info"]}: ${toast.description}. Klik untuk menutup.`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {toast.tone === "success" ? (
            <div className="success-mark-wrap mt-0.5" aria-hidden="true">
              <span className="success-mark-ring" />
              <span className="success-mark-ring success-mark-ring-delay" />
              <span className="success-mark-core">
                <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                  <path d="M5 10.5L8.2 13.7L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em]">
              {toastToneLabels[toast.tone ?? "info"]}
            </p>
            <p className="mt-2 text-sm leading-6">{toast.description}</p>
          </div>
        </div>
        <span className="shrink-0 font-label text-xs uppercase tracking-[0.12em] opacity-70">Tutup</span>
      </div>
      <div className="toast-progress mt-3 overflow-hidden rounded-full bg-[rgba(255,255,255,0.46)]">
        <div className={cn("toast-progress-bar", toast.tone === "success" ? "toast-progress-bar-success" : "toast-progress-bar-neutral")} />
      </div>
    </button>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    setToasts((current) => [
      ...current,
      {
        ...toast,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      }
    ]);
  }, []);

  const value = useMemo(
    () => ({
      dismissToast,
      pushToast
    }),
    [dismissToast, pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] px-4 sm:left-auto sm:right-4 sm:top-5 sm:w-full sm:max-w-md">
        <div className="pointer-events-auto flex flex-col gap-3">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      </div>
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
