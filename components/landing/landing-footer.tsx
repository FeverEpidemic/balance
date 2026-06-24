"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { Logo } from "@/components/brand/logo";
import { getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", key: "landing.navFeatures" },
  { href: "#how-it-works", key: "landing.navHowItWorks" },
  { href: "#pricing", key: "landing.navPricing" },
] as const;

const pageLinks = [
  { href: "/privacy", key: "common.privacy" },
  { href: "/terms", key: "common.terms" },
] as const;

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden="true"
    >
      <path d="M19.25 8.5c-1.5-2-4.5-3.5-7.75-3.5-5.5 0-9 3-9 7s3.5 7 9 7c4.5 0 7-1.5 8.5-3" />
      <path d="M14.5 12a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
      <path d="M12 9.5c2 0 3 1.5 3 3" />
    </svg>
  );
}

export function LandingFooter() {
  const locale = useLocale();
  const t = getTranslator(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border/40 bg-gradient-to-b from-transparent via-primary-soft/5 to-primary-soft/10">
      <div className="mx-auto max-w-app px-4 pb-6 pt-12 sm:px-6 lg:px-8">
        {/* 4-column grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Logo variant="icon" className="h-9 w-9" />
              <span className="font-label text-sm font-semibold text-foreground">
                {t("app.name")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t("app.tagline")}</p>
          </div>

          {/* Navigasi */}
          <div className="space-y-3">
            <h3 className="font-label text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {t("landing.footerNavTitle")}
            </h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(link.key)}
                  </a>
                </li>
              ))}
              {pageLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={localizePath(locale, link.href)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak & Sosmed */}
          <div className="space-y-3">
            <h3 className="font-label text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {t("landing.footerContactTitle")}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="mailto:support@mybalance.my.id"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  support@mybalance.my.id
                </Link>
              </li>
              <li>
                <a
                  href="https://instagram.com/mybalance.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                  aria-label={t("landing.footerSocialLabel", { platform: "Instagram", handle: "@mybalance.my.id" })}
                >
                  <InstagramIcon />
                  @mybalance.my.id
                </a>
              </li>
              <li>
                <a
                  href="https://threads.net/@mybalance.my.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                  aria-label={t("landing.footerSocialLabel", { platform: "Threads", handle: "@mybalance.my.id" })}
                >
                  <ThreadsIcon />
                  @mybalance.my.id
                </a>
              </li>
            </ul>
          </div>

          {/* Trust */}
          <div className="space-y-3">
            <h3 className="font-label text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {t("landing.footerTrustTitle")}
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary-strong">
                🔒 {t("landing.footerEncrypted")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary-strong">
                🇮🇩 {t("landing.footerMadeIn")}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border/40 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            {t("landing.footerCopyright", { year: String(year) })}
          </p>
        </div>
      </div>
    </footer>
  );
}
