"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function WalletTabs({ walletId, active }: { walletId: string; active: string }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const mainTabs = [
    { slug: "", label: t("common.overview") },
    { slug: "/transactions", label: t("common.transactions") },
    { slug: "/savings", label: t("common.savings") },
    { slug: "/budgets", label: t("common.budgets") },
    { slug: "/reports", label: t("common.reports") }
  ];

  const settingsTabs = [
    { slug: "/members", label: t("common.members") },
    { slug: "/settlements", label: t("common.settlements") },
    { slug: "/templates", label: t("common.templates") },
    { slug: "/recurring", label: t("common.automatic") }
  ];

  const settingsActive = settingsTabs.some((tab) => active === `/wallets/${walletId}${tab.slug}`);

  return (
    <div className="mb-4 overflow-x-auto">
      <div className="glass-panel inline-flex min-w-full gap-2 rounded-2xl p-2">
        {mainTabs.map((tab) => {
          const href = `/wallets/${walletId}${tab.slug}`;
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={localizePath(locale, href)}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-2 font-label text-xs font-semibold uppercase tracking-[0.12em] transition sm:px-4 sm:py-3 sm:text-sm sm:normal-case sm:tracking-[0.02em]",
                isActive
                  ? "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-hover"
                  : "text-muted-foreground hover:bg-[color:color-mix(in_srgb,var(--muted)_88%,var(--surface-container-lowest)_12%)] hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}

        {/* Settings dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
              "whitespace-nowrap rounded-xl px-3 py-2 font-label text-xs font-semibold uppercase tracking-[0.12em] transition sm:px-4 sm:py-3 sm:text-sm sm:normal-case sm:tracking-[0.02em]",
              settingsActive
                ? "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-hover"
                : "text-muted-foreground hover:bg-[color:color-mix(in_srgb,var(--muted)_88%,var(--surface-container-lowest)_12%)] hover:text-foreground"
            )}
          >
            <span className="inline-flex items-center gap-1">
              {t("common.settings")}
              <svg className={cn("h-3 w-3 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {open ? (
            <div className="absolute left-0 top-full z-50 mt-2 min-w-[12rem] rounded-xl border border-border bg-card p-1.5 shadow-[0_12px_40px_-4px_rgba(45,54,39,0.1)]">
              {settingsTabs.map((tab) => {
                const href = `/wallets/${walletId}${tab.slug}`;
                const isActive = active === href;
                return (
                  <Link
                    key={href}
                    href={localizePath(locale, href)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm transition",
                      isActive
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
