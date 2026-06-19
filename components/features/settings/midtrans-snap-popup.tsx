"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMidtransSnapJsUrl, getMidtransClientKey } from "@/lib/midtrans/client-config";
import { createSubscription, type CreateSubscriptionResult } from "@/app/actions/subscriptions";

type MidtransSnapPopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the payment flow completes or is cancelled. */
  onComplete?: (result: { success: boolean; message?: string }) => void;
};

/**
 * Client-side popup that loads Midtrans Snap.js and opens the payment popup.
 *
 * Steps:
 * 1. Creates a subscription via server action → gets Snap token
 * 2. Loads Snap.js script dynamically (client-only)
 * 3. Calls snap.pay(token) → Midtrans shows payment popup
 * 4. Handles callbacks (success / pending / error)
 */
export function MidtransSnapPopup({ open, onOpenChange, onComplete }: MidtransSnapPopupProps) {
  const [period, setPeriod] = useState<"monthly" | "annual" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "paying" | "done">("select");

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Delay reset so the close animation plays
      const timer = setTimeout(() => {
        setPeriod(null);
        setLoading(false);
        setError(null);
        setStep("select");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelectPeriod = async (selectedPeriod: "monthly" | "annual") => {
    setPeriod(selectedPeriod);
    setError(null);
    setStep("paying");
    setLoading(true);

    try {
      // 1. Create subscription via server action
      const formData = new FormData();
      formData.set("period", selectedPeriod);

      const result: CreateSubscriptionResult = await createSubscription(formData);

      if ("error" in result) {
        setError(result.error);
        setStep("select");
        setLoading(false);
        return;
      }

      // 2. Load Midtrans Snap.js
      await loadSnapScript();

      // 3. Open Snap popup
      // window.snap is set by the Snap.js script
      const snap = (window as unknown as { snap?: { pay: (token: string, options?: Record<string, unknown>) => void } }).snap;

      if (!snap) {
        setError("Gagal memuat popup pembayaran. Silakan coba lagi.");
        setStep("select");
        setLoading(false);
        return;
      }

      snap.pay(result.data.token, {
        onSuccess: () => {
          setStep("done");
          setLoading(false);
          onComplete?.({ success: true, message: "Pembayaran berhasil! Langganan Premium kamu akan aktif dalam beberapa saat." });
        },
        onPending: () => {
          setStep("done");
          setLoading(false);
          onComplete?.({ success: true, message: "Pembayaran sedang diproses. Kami akan memperbarui status langganan secara otomatis." });
        },
        onError: () => {
          setError("Pembayaran gagal. Silakan coba lagi.");
          setStep("select");
          setLoading(false);
        },
        onClose: () => {
          // User closed the Snap popup without completing
          setStep("select");
          setLoading(false);
          onComplete?.({ success: false, message: "Pembayaran dibatalkan." });
        },
      });
    } catch (err) {
      console.error("[MidtransSnapPopup] Error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setStep("select");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pilih Paket Premium</DialogTitle>
          <DialogDescription>
            Nikmati fitur lengkap Balance tanpa batas.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === "select" && (
          <div className="mt-2 grid gap-3">
            {/* Monthly option */}
            <button
              onClick={() => handleSelectPeriod("monthly")}
              disabled={loading}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary disabled:opacity-50"
            >
              <div>
                <p className="font-label text-sm font-semibold text-foreground">Premium Bulanan</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Akses premium selama 30 hari</p>
              </div>
              <div className="text-right">
                <p className="font-label text-lg font-bold text-foreground">Rp 29.000</p>
                <p className="text-xs text-muted-foreground">/bulan</p>
              </div>
            </button>

            {/* Annual option */}
            <button
              onClick={() => handleSelectPeriod("annual")}
              disabled={loading}
              className="relative flex items-center justify-between rounded-xl border-2 border-primary bg-card p-4 text-left transition-colors hover:bg-primary/5 disabled:opacity-50"
            >
              <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2.5 py-0.5 font-label text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                Hemat 28%
              </span>
              <div>
                <p className="font-label text-sm font-bold text-foreground">Premium Tahunan</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Hanya Rp 20.833/bulan</p>
              </div>
              <div className="text-right">
                <p className="font-label text-lg font-bold text-foreground">Rp 250.000</p>
                <p className="text-xs text-muted-foreground">/tahun</p>
              </div>
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Pembayaran diproses oleh Midtrans. Data kartu aman terenkripsi.
            </p>
          </div>
        )}

        {step === "paying" && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">
                Menyiapkan pembayaran...
              </p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-xl text-primary">
                ✓
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Permintaan pembayaran sedang diproses.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Dynamically loads the Midtrans Snap.js script.
 * Resolves when the script is ready (window.snap is available).
 */
function loadSnapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as unknown as { snap?: unknown }).snap) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = getMidtransSnapJsUrl();
    script.setAttribute("data-client-key", getMidtransClientKey());
    script.async = true;

    script.onload = () => {
      // Give a tick for snap to initialize
      const check = () => {
        if ((window as unknown as { snap?: unknown }).snap) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      setTimeout(check, 200);
    };

    script.onerror = () => {
      reject(new Error("Failed to load Midtrans Snap.js"));
    };

    document.head.appendChild(script);
  });
}
