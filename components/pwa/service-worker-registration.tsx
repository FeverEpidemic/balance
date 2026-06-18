"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function ServiceWorkerRegistration() {
  const refreshToastId = useRef<string | number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

    if (process.env.NODE_ENV === "test" || (process.env.NODE_ENV !== "production" && !isLocalhost)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      registration = reg;

      // If a new SW is already waiting (e.g. from a previous visit), show toast
      if (reg.waiting) {
        showUpdateToast(reg.waiting);
      }

      // Listen for new SW entering waiting state
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            showUpdateToast(newWorker);
          }
        });
      });
    }).catch(() => {
      // Ignore registration failures so the app remains usable without PWA features.
    });

    // Listen for controller change (new SW took over)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // Page will be reloaded by the toast action — if somehow we get here without
      // the toast having fired, reload anyway so the new SW takes full effect.
      if (!refreshToastId.current) {
        window.location.reload();
      }
    });

    // Listen for SYNC_TRIGGERED messages from the SW (background sync)
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SYNC_TRIGGERED") {
        // Dispatch a custom event so the SyncManager or transaction form can pick it up
        window.dispatchEvent(new CustomEvent("balance:sync-triggered"));
      }
    });

    function showUpdateToast(worker: ServiceWorker) {
      // Avoid duplicate toasts
      if (refreshToastId.current) return;

      refreshToastId.current = toast("Update tersedia — versi terbaru Balance sudah siap.", {
        description: "Refresh halaman untuk menggunakan versi terbaru.",
        duration: Infinity,
        action: {
          label: "Refresh",
          onClick: () => {
            // Tell the waiting SW to skip waiting and activate
            worker.postMessage({ type: "SKIP_WAITING" });
            // Reload after a short delay to let the new SW activate
            setTimeout(() => window.location.reload(), 300);
          }
        },
        cancel: {
          label: "Nanti",
          onClick: () => {
            refreshToastId.current = null;
          }
        }
      });
    }

    return () => {
      refreshToastId.current = null;
    };
  }, []);

  return null;
}
