"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon } from "@/components/ui/app-icon";
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
  const activeWalletLinkClassName = "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-hover";
  const inactiveWalletLinkClassName =
    "bg-muted text-foreground hover:bg-[color:color-mix(in_srgb,var(--muted)_82%,var(--surface-container-lowest)_18%)] hover:text-foreground";
  const inactiveWalletPillClassName =
    "glass-panel border text-muted-foreground hover:border-primary/25 hover:bg-[color:var(--primary-soft)] hover:text-foreground";
  const navItems = [
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard" as const },
    { href: "/wallets", label: t("common.wallet"), icon: "wallet" as const },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/wallets", label: t("common.transactions"), icon: "transactions" as const },
    { href: walletId ? `/wallets/${walletId}/savings` : "/wallets", label: t("common.savings"), icon: "savings" as const },
    { href: walletId ? `/wallets/${walletId}/budgets` : "/wallets", label: t("common.budgets"), icon: "budgets" as const },
    { href: walletId ? `/wallets/${walletId}/reports` : "/wallets", label: t("common.reports"), icon: "reports" as const },
    { href: walletId ? `/wallets/${walletId}/members` : "/wallets", label: t("common.members"), icon: "members" as const },
    { href: walletId ? `/wallets/${walletId}/settlements` : "/wallets", label: t("common.settlements"), icon: "settlements" as const },
    { href: walletId ? `/wallets/${walletId}/templates` : "/wallets", label: t("common.templates"), icon: "templates" as const },
    { href: "/settings", label: t("common.settings"), icon: "settings" as const }
  ];
  const mobileNavItems = [
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard" as const },
    { href: "/wallets", label: t("common.wallet"), icon: "wallet" as const },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/wallets", label: t("common.transactions"), icon: "transactions" as const },
    { href: walletId ? `/wallets/${walletId}/reports` : "/wallets", label: t("common.reports"), icon: "reports" as const },
    { href: "/settings", label: t("common.settings"), icon: "settings" as const }
  ];
  const mobileWalletShortcuts = walletId
    ? [
        { href: `/wallets/${walletId}`, label: t("common.overview"), icon: "overview" as const },
        { href: `/wallets/${walletId}/transactions`, label: t("common.transactions"), icon: "transactions" as const },
        { href: `/wallets/${walletId}/savings`, label: t("common.savings"), icon: "savings" as const },
        { href: `/wallets/${walletId}/recurring`, label: t("common.automatic"), icon: "automatic" as const },
        { href: `/wallets/${walletId}/budgets`, label: t("common.budgets"), icon: "budgets" as const },
        { href: `/wallets/${walletId}/reports`, label: t("common.reports"), icon: "reports" as const },
        { href: `/wallets/${walletId}/members`, label: t("common.members"), icon: "members" as const },
        { href: `/wallets/${walletId}/settlements`, label: t("common.settlements"), icon: "settlements" as const },
        { href: `/wallets/${walletId}/templates`, label: t("common.templates"), icon: "templates" as const }
      ]
    : [];

  return (
    <div className="page-wrap section-gap">
      <div className="app-grid">
        <aside className="card hidden h-fit lg:block">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">balance</p>
              <h1 className="headline-md mt-2">{t("app.shellHeroTitle")}</h1>
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
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition",
                  isActivePath(currentPath, item.href) ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <AppIcon name={item.icon} className="h-4 w-4" tone={isActivePath(currentPath, item.href) ? "primary" : "muted"} />
                <span>{item.label}</span>
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
                      <span className="inline-flex items-center gap-2">
                        <AppIcon name="menu" className="h-4 w-4" tone="muted" />
                        <span>{t("common.menu")}</span>
                      </span>
                    </button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <p className="eyebrow">{t("app.navigationEyebrow")}</p>
                      <SheetTitle>{t("app.navigationTitle")}</SheetTitle>
                      <SheetDescription>{t("app.navigationDescription")}</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6 overflow-y-auto pb-4">
                      <div>
                        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("app.navigationMain")}</p>
                        <nav className="mt-3 space-y-2">
                          {mobileNavItems.map((item) => (
                            <SheetClose key={item.href} asChild>
                              <Link
                                href={localizePath(locale, item.href)}
                                className={cn(
                                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                                  isActivePath(currentPath, item.href)
                                    ? "bg-muted font-medium text-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                                )}
                              >
                                <AppIcon name={item.icon} className="h-4 w-4" tone={isActivePath(currentPath, item.href) ? "primary" : "muted"} />
                                <span>{item.label}</span>
                              </Link>
                            </SheetClose>
                          ))}
                        </nav>
                      </div>
                      {mobileWalletShortcuts.length > 0 ? (
                        <div>
                          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("app.navigationActiveWallet")}</p>
                          <nav className="mt-3 space-y-2">
                            {mobileWalletShortcuts.map((item) => (
                              <SheetClose key={item.href} asChild>
                                <Link
                                  href={localizePath(locale, item.href)}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                                    isActivePath(currentPath, item.href)
                                      ? activeWalletLinkClassName
                                      : inactiveWalletLinkClassName
                                  )}
                                >
                                  <AppIcon name={item.icon} className="h-4 w-4" />
                                  <span>{item.label}</span>
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
                  {t("app.shellHeaderDescription")}
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
                            ? "border-primary bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-hover"
                            : inactiveWalletPillClassName
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <AppIcon name={item.icon} className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </span>
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
                "min-w-[calc(50%-0.25rem)] flex-1 rounded-xl px-2 py-2 text-center font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition",
                isActivePath(currentPath, item.href) ? "bg-primary text-[var(--button-primary-text)]" : "bg-transparent text-muted-foreground"
              )}
            >
              <span className="flex flex-col items-center justify-center gap-1">
                <AppIcon name={item.icon} className="h-4 w-4" />
                <span>{item.label}</span>
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
