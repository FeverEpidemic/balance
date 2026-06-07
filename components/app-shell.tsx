"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { ReactNode } from "react";

function isActivePath(currentPath: string, href: string) {
  if (href === "/wallets") {
    return currentPath === "/wallets" || currentPath.startsWith("/wallets/");
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AppShell({
  children,
  currentPath,
  title,
  subtitle,
  userName,
  walletCount,
  budgetCount,
  memberCount,
  primaryWalletId,
  currentWalletId,
  headerAction
}: {
  children: ReactNode;
  currentPath: string;
  title: string;
  subtitle: string;
  userName: string;
  walletCount: number;
  budgetCount: number;
  memberCount: number;
  primaryWalletId: string | null;
  currentWalletId?: string | null;
  headerAction?: ReactNode;
}) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const walletId = currentWalletId ?? primaryWalletId;
  const logoutButtonClassName = "rounded-full bg-primary-soft px-3 py-2 font-label text-xs text-primary-strong";
  const mobileUtilityButtonClassName = "glass-panel rounded-full px-3 py-2 font-label text-xs text-foreground";
  const navItems = [
    { href: "/dashboard", label: t("common.dashboard") },
    { href: "/wallets", label: t("common.wallet") },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/wallets", label: t("common.transactions") },
    { href: walletId ? `/wallets/${walletId}/savings` : "/wallets", label: t("common.savings") },
    { href: walletId ? `/wallets/${walletId}/budgets` : "/wallets", label: t("common.budgets") },
    { href: walletId ? `/wallets/${walletId}/reports` : "/wallets", label: t("common.reports") },
    { href: walletId ? `/wallets/${walletId}/members` : "/wallets", label: t("common.members") },
    { href: walletId ? `/wallets/${walletId}/settlements` : "/wallets", label: t("common.settlements") },
    { href: walletId ? `/wallets/${walletId}/templates` : "/wallets", label: t("common.templates") },
    { href: "/settings", label: t("common.settings") }
  ];
  const mobileNavItems = [
    { href: "/dashboard", label: t("common.dashboard") },
    { href: "/wallets", label: t("common.wallet") },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/wallets", label: t("common.transactions") },
    { href: walletId ? `/wallets/${walletId}/reports` : "/wallets", label: t("common.reports") },
    { href: "/settings", label: t("common.settings") }
  ];
  const mobileWalletShortcuts = walletId
    ? [
        { href: `/wallets/${walletId}`, label: t("common.overview") },
        { href: `/wallets/${walletId}/transactions`, label: t("common.transactions") },
        { href: `/wallets/${walletId}/savings`, label: t("common.savings") },
        { href: `/wallets/${walletId}/recurring`, label: t("common.automatic") },
        { href: `/wallets/${walletId}/budgets`, label: t("common.budgets") },
        { href: `/wallets/${walletId}/reports`, label: t("common.reports") },
        { href: `/wallets/${walletId}/members`, label: t("common.members") },
        { href: `/wallets/${walletId}/settlements`, label: t("common.settlements") },
        { href: `/wallets/${walletId}/templates`, label: t("common.templates") }
      ]
    : [];

  return (
    <div className="page-wrap section-gap">
      <div className="app-grid">
        <aside className="card hidden h-fit lg:block">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">balance</p>
              <h1 className="headline-md mt-2">{locale === "en" ? "Structured finances create peace of mind." : "Keuangan yang terstruktur menciptakan ketenangan pikiran"}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{userName}</p>
            </div>
            <form action={logout}>
              <button className={logoutButtonClassName}>{t("common.logout")}</button>
            </form>
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-4 py-3 text-sm transition",
                  isActivePath(currentPath, item.href) ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="glass-panel mb-4 rounded-[1.25rem] px-4 py-4 backdrop-blur md:px-6">
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <p className="text-sm text-muted-foreground">{userName}</p>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <button type="button" className={mobileUtilityButtonClassName}>
                      {t("common.menu")}
                    </button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <p className="eyebrow">{locale === "en" ? "Navigation" : "Navigasi"}</p>
                      <SheetTitle>{locale === "en" ? "Browse wallet areas and main pages" : "Jelajahi wallet dan halaman utama"}</SheetTitle>
                      <SheetDescription>{locale === "en" ? "Use this drawer to jump to more detailed wallet destinations without disturbing the main bottom navigation." : "Pakai drawer ini untuk pindah ke tujuan wallet yang lebih lengkap tanpa mengganggu bottom navigation utama."}</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6 overflow-y-auto pb-4">
                      <div>
                        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{locale === "en" ? "Main" : "Utama"}</p>
                        <nav className="mt-3 space-y-2">
                          {mobileNavItems.map((item) => (
                <SheetClose key={item.href} asChild>
                              <Link
                                href={localizePath(locale, item.href)}
                                className={cn(
                                  "block rounded-xl px-4 py-3 text-sm transition",
                                  isActivePath(currentPath, item.href)
                                    ? "bg-muted font-medium text-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {item.label}
                              </Link>
                            </SheetClose>
                          ))}
                        </nav>
                      </div>
                      {mobileWalletShortcuts.length > 0 ? (
                        <div>
                          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{locale === "en" ? "Active wallet" : "Wallet aktif"}</p>
                          <nav className="mt-3 space-y-2">
                            {mobileWalletShortcuts.map((item) => (
                              <SheetClose key={item.href} asChild>
                                <Link
                                  href={localizePath(locale, item.href)}
                                  className={cn(
                                    "block rounded-xl px-4 py-3 text-sm transition",
                                    isActivePath(currentPath, item.href)
                                      ? "bg-primary text-white"
                                      : "bg-muted text-foreground hover:bg-white"
                                  )}
                                >
                                  {item.label}
                                </Link>
                              </SheetClose>
                            ))}
                          </nav>
                        </div>
                      ) : null}
                    </div>
                  </SheetContent>
                </Sheet>
                <form action={logout}>
                  <button className={logoutButtonClassName}>{t("common.logout")}</button>
                </form>
              </div>
            </div>
            <p className="eyebrow">{title}</p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="headline-lg">{subtitle}</h2>
                  {headerAction ? <div className="shrink-0 md:hidden">{headerAction}</div> : null}
                </div>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {locale === "en" ? "Review your finances, tidy up records, and keep a calm money rhythm every day." : "Cek kondisi keuangan, rapikan catatan, dan jaga ritme finansial tetap tenang setiap hari."}
                </p>
                {mobileWalletShortcuts.length > 0 ? (
                  <div className="touch-scroll-x mt-4 flex gap-2 pb-1 pr-1 lg:hidden">
                    {mobileWalletShortcuts.map((item) => (
                      <Link
                        key={item.href}
                        href={localizePath(locale, item.href)}
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-full border px-3 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition",
                          isActivePath(currentPath, item.href)
                            ? "border-primary bg-primary text-white"
                            : "glass-panel border text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                {headerAction ? <div className="hidden md:flex w-full justify-start md:justify-end">{headerAction}</div> : null}
                <div className="grid w-full max-w-sm grid-cols-3 gap-2 rounded-xl bg-card p-2 shadow-serene md:w-auto">
                  <div className="rounded-lg bg-muted px-3 py-2 text-center">
                    <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("common.wallet")}</p>
                    <p className="mt-1 metric text-sm">{walletCount}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2 text-center">
                    <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("common.budgets")}</p>
                    <p className="mt-1 metric text-sm">{budgetCount}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2 text-center">
                    <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("common.members")}</p>
                    <p className="mt-1 metric text-sm">{memberCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="pb-24 lg:pb-0">{children}</div>
        </main>
      </div>

      <nav className="glass-nav fixed inset-x-4 bottom-4 z-50 rounded-2xl p-2 backdrop-blur lg:hidden">
        <div className="touch-scroll-x flex gap-2">
          {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={localizePath(locale, item.href)}
                className={cn(
                "min-w-[calc(50%-0.25rem)] flex-1 rounded-xl px-2 py-3 text-center font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition",
                isActivePath(currentPath, item.href) ? "bg-primary text-white" : "bg-transparent text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
