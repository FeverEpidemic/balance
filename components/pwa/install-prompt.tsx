"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  }
}

const DISMISS_KEY = "balance-pwa-install-dismissed";

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "true";
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (typeof navigator !== "undefined" && "standalone" in navigator && Boolean(navigator.standalone));

    setIsDismissed(dismissed || isStandalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setIsDismissed(dismissed || isStandalone);
    };

    const handleAppInstalled = () => {
      window.localStorage.setItem(DISMISS_KEY, "true");
      setInstallEvent(null);
      setIsDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (!installEvent || isDismissed) {
    return null;
  }

  const dismissPrompt = () => {
    window.localStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;

      if (choice.outcome !== "accepted") {
        setInstallEvent(null);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="glass-panel mt-6 max-w-2xl rounded-[1.5rem] p-4 backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-label text-xs uppercase tracking-[0.16em] text-primary-strong">Install aplikasi</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Simpan Balance ke homescreen biar buka catatan uang terasa lebih cepat dan rapi.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" size="sm" onClick={handleInstall} className={isInstalling ? "opacity-80" : undefined}>
            {isInstalling ? "Menyiapkan..." : "Install"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={dismissPrompt}>
            Nanti dulu
          </Button>
        </div>
      </div>
    </div>
  );
}
