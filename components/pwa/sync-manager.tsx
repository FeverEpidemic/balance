"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { flushQueue, registerBackgroundSync } from "@/lib/pwa/offline-queue";

export function SyncManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register for background sync when the component mounts
    registerBackgroundSync();

    const handleSyncTriggered = async () => {
      try {
        const synced = await flushQueue();
        if (synced.length > 0) {
          toast.success(`${synced.length} transaksi offline berhasil disinkronkan.`);
        }
      } catch {
        // Flush failed silently — will retry on next sync
      }
    };

    window.addEventListener("balance:sync-triggered", handleSyncTriggered);

    // Also try to flush on mount (user came back online)
    handleSyncTriggered();

    return () => {
      window.removeEventListener("balance:sync-triggered", handleSyncTriggered);
    };
  }, []);

  return null;
}
