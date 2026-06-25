"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator, localizePath, type AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const localeOptions: { locale: AppLocale; labelKey: string }[] = [
  { locale: "id", labelKey: "settings.languageIdLabel" },
  { locale: "en", labelKey: "settings.languageEnLabel" }
];

export function LandingLocaleSwitcher({ className }: { className?: string }) {
  const currentLocale = useLocale();
  const t = getTranslator(currentLocale);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    // Close on Escape
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function switchTo(locale: AppLocale) {
    if (locale === currentLocale) {
      setOpen(false);
      return;
    }

    // Preserve hash/anchor
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const targetPath = localizePath(locale, "/") + hash;

    setOpen(false);
    router.push(targetPath);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("settings.languageTitle")}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:bg-[color:var(--primary-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]"
        )}
      >
        <Globe className="size-4" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("settings.languageTitle")}
          className={cn(
            "absolute right-0 z-50 mt-2 min-w-[11rem] origin-top-right rounded-xl border border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)] py-2 shadow-float",
            // Scale + fade animation
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          {localeOptions.map((option) => {
            const isActive = option.locale === currentLocale;

            return (
              <button
                key={option.locale}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => switchTo(option.locale)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition hover:bg-[color:var(--primary-soft)]",
                  isActive
                    ? "font-semibold text-primary-strong"
                    : "text-foreground"
                )}
              >
                <span>{t(option.labelKey)}</span>
                {isActive && (
                  <span className="ml-2 text-xs text-primary-strong">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
