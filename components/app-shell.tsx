"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChangelogPopup } from "@/components/features/changelogs/changelog-popup";
import { UnifiedSidebar, useSidebarState, SIDEBAR_STORAGE_KEY } from "@/components/sidebar";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon } from "@/components/ui/app-icon";
import { getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import type { ReactNode } from "react";

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [isDesktop, setIsDesktop] = useState(false);

  // Sync desktop detection — avoids SSR hydration mismatch
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024);
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sidebar width used by the flex layout
  const desktopSidebarWidth = isDesktop ? (sidebarCollapsed ? 72 : 280) : 0;

  const logoutButtonClassName = "rounded-full bg-primary-soft px-3 py-2 font-label text-xs text-primary-strong";
  const inactiveWalletPillClassName =
    "glass-panel border text-muted-foreground hover:border-primary/25 hover:bg-[color:var(--primary-soft)] hover:text-foreground";
  const mobileNavItems = [
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard" as const },
    { href: walletId ? `/wallets/${walletId}` : "/dashboard", label: t("common.wallet"), icon: "wallet" as const },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/dashboard", label: t("common.transactions"), icon: "transactions" as const },
    { href: "/chat", label: t("common.aiAssistant"), icon: "chat" as const },
    { href: "/settings", label: t("common.settings"), icon: "settings" as const }
  ];
  const mobileWalletShortcuts = walletId
    ? [
        { href: `/wallets/${walletId}`, label: t("common.overview"), icon: "overview" as const },
        { href: `/wallets/${walletId}/transactions`, label: t("common.transactions"), icon: "transactions" as const },
        { href: `/wallets/${walletId}/savings`, label: t("common.savings"), icon: "savings" as const },
        { href: `/wallets/${walletId}/budgets`, label: t("common.budgets"), icon: "budgets" as const },
        { href: `/wallets/${walletId}/reports`, label: t("common.reports"), icon: "reports" as const },
      ]
    : [];

  return (
    <div className="flex min-h-screen">
      {/* Desktop fixed sidebar — flex item on desktop, overlay on mobile */}
      <div
        className="hidden shrink-0 lg:block"
        style={{ width: desktopSidebarWidth, transition: "width 200ms ease-out" }}
        aria-hidden
      />

      {/* Actual sidebar (fixed positioned) */}
      <UnifiedSidebar
        currentPath={currentPath}
        userName={userName}
        walletId={walletId}
        variant="fixed"
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile overlay sidebar */}
      <UnifiedSidebar
        currentPath={currentPath}
        userName={userName}
        walletId={walletId}
        variant="overlay"
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChangelogPopup />

        <main className="page-wrap section-gap">
          <header className="glass-panel mb-4 rounded-[1.25rem] px-4 py-4 backdrop-blur md:px-6">
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <p className="text-sm text-muted-foreground">{userName}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="glass-panel rounded-full px-3 py-2 font-label text-xs text-foreground"
                >
                  <span className="inline-flex items-center gap-2">
                    <AppIcon name="menu" className="h-4 w-4" tone="muted" />
                    <span>{t("common.menu")}</span>
                  </span>
                </button>
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
    </div>
  );
}

function isActivePath(currentPath: string, href: string) {
  if (href === "/dashboard") {
    return currentPath === "/dashboard" || currentPath === "/wallets";
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}
