"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { LandingThemeToggle } from "@/components/landing/landing-theme-toggle";
import { LandingLocaleSwitcher } from "@/components/landing/landing-locale-switcher";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

const navLinks = [
  { href: "#features", key: "landing.navFeatures" },
  { href: "#how-it-works", key: "landing.navHowItWorks" },
  { href: "#pricing", key: "landing.navPricing" }
] as const;

export function LandingHeader() {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHash, setActiveHash] = useState<string>(navLinks[0].href);

  function closeMobile() {
    setMobileOpen(false);
  }

  function handleAnchorClick(href: string) {
    setActiveHash(href);
    closeMobile();
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncHash = () => {
      const { hash } = window.location;
      setActiveHash(navLinks.some((link) => link.href === hash) ? hash : navLinks[0].href);
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobile();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 px-4 pt-4 md:px-10 md:pt-5">
        <div className="mx-auto max-w-app">
          <div className="landing-header-shell glass-panel-strong flex items-center justify-between gap-3 rounded-[1.6rem] px-3 py-3 shadow-float md:px-4 lg:px-5">
            <a
              href={`/${locale}`}
              className="flex items-center gap-2 rounded-full px-2 py-1.5 text-foreground transition hover:bg-[color:var(--primary-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]"
            >
              <Logo variant="wordmark" className="h-9 md:h-10" />
            </a>

            <nav className="hidden items-center gap-2 rounded-full border border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/55 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] lg:flex">
              {navLinks.map((link) => {
                const isActive = activeHash === link.href;

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={cn("landing-header-link", isActive && "landing-header-link-active")}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => handleAnchorClick(link.href)}
                  >
                    {t(link.key)}
                  </a>
                );
              })}
            </nav>

            <div className="hidden items-center gap-2 lg:flex">
              <LandingLocaleSwitcher />
              <LandingThemeToggle />
              <Button href="/login" variant="ghost" size="sm" className="rounded-full px-4">
                {t("landing.navLogin")}
              </Button>
              <Button href="/register" size="sm" className="rounded-full px-5">
                {t("landing.navRegister")}
              </Button>
            </div>

            <button
              type="button"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/70 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition hover:bg-[color:var(--primary-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)] lg:hidden",
                mobileOpen && "bg-primary text-[var(--button-primary-text)] hover:bg-primary-hover"
              )}
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={t("landing.mobileMenuLabel")}
              aria-expanded={mobileOpen}
              aria-controls="landing-mobile-menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="theme-overlay fixed inset-0 z-40 px-4 pb-6 pt-24 backdrop-blur-sm lg:hidden md:px-10">
          <div
            id="landing-mobile-menu"
            role="dialog"
            aria-modal="true"
            className="landing-mobile-menu glass-panel-strong mx-auto flex max-w-app flex-col overflow-hidden rounded-[1.75rem] shadow-float"
          >
            <div className="flex items-center justify-between border-b border-[color:var(--soft-border)] px-5 py-4">
              <a href={`/${locale}`} onClick={closeMobile}>
                <Logo variant="wordmark" className="h-8" />
              </a>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/70 text-foreground transition hover:bg-[color:var(--primary-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]"
                onClick={closeMobile}
                aria-label={t("landing.mobileMenuLabel")}
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-2 px-4 py-5">
              {navLinks.map((link) => {
                const isActive = activeHash === link.href;

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "landing-header-link flex items-center justify-between rounded-[1.1rem] px-4 py-3 text-base",
                      isActive && "landing-header-link-active"
                    )}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => handleAnchorClick(link.href)}
                  >
                    <span>{t(link.key)}</span>
                  </a>
                );
              })}
            </nav>

            <div className="border-t border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/42 px-4 py-4">
              <div className="flex flex-col gap-3">
                <LandingLocaleSwitcher />
                <LandingThemeToggle mobile />
                <Button href="/login" variant="ghost" className="rounded-full">
                  {t("landing.navLogin")}
                </Button>
                <Button href="/register" className="rounded-full">
                  {t("landing.navRegister")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
