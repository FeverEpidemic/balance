"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n";

const navLinks = [
  { href: "#features", key: "landing.navFeatures" },
  { href: "#how-it-works", key: "landing.navHowItWorks" },
  { href: "#pricing", key: "landing.navPricing" }
] as const;

export function LandingHeader() {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-app items-center justify-between px-4 py-3 md:px-10">
          {/* Logo */}
          <a href={`/${locale}`} className="font-display text-xl font-semibold tracking-tight text-foreground">
            Balance
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                {t(link.key)}
              </a>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <Button href="/login" variant="ghost" size="sm">
              {t("landing.navLogin")}
            </Button>
            <Button href="/register" size="sm">
              {t("landing.navRegister")}
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex items-center justify-center lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("landing.mobileMenuLabel")}
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-background/95 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-10">
            <a
              href={`/${locale}`}
              className="font-display text-xl font-semibold tracking-tight text-foreground"
              onClick={closeMobile}
            >
              Balance
            </a>
            <button
              type="button"
              className="flex items-center justify-center"
              onClick={closeMobile}
              aria-label={t("landing.mobileMenuLabel")}
            >
              <X className="size-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-2 px-4 pt-8 md:px-10">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-base text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={closeMobile}
              >
                {t(link.key)}
              </a>
            ))}
          </nav>

          <div className="mt-auto border-t border-border px-4 py-6 md:px-10">
            <div className="flex flex-col gap-3">
              <Button href="/login" variant="ghost">
                {t("landing.navLogin")}
              </Button>
              <Button href="/register">
                {t("landing.navRegister")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
