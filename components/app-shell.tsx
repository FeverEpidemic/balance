"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChangelogPopup } from "@/components/features/changelogs/changelog-popup";
import { UnifiedSidebar, useSidebarState } from "@/components/sidebar";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon } from "@/components/ui/app-icon";
import { getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import type { ReactNode } from "react";

function getNavItemKey(item: { href: string; icon: Parameters<typeof AppIcon>[0]["name"] }) {
  return `${item.icon}:${item.href}`;
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
  headerAction,
  subtitleClassName,
  headerBody,
  headerFooter,
  hideDefaultHeaderStats = false
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
  subtitleClassName?: string;
  headerBody?: ReactNode;
  headerFooter?: ReactNode;
  hideDefaultHeaderStats?: boolean;
}) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const walletId = currentWalletId ?? primaryWalletId;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [isDesktop, setIsDesktop] = useState(false);

  // Keep desktop-only sidebar out of the mobile tree entirely.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const syncDesktop = () => setIsDesktop(mediaQuery.matches);

    syncDesktop();
    mediaQuery.addEventListener("change", syncDesktop);

    return () => mediaQuery.removeEventListener("change", syncDesktop);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  // Sidebar width used by the flex layout
  const desktopSidebarWidth = isDesktop ? (sidebarCollapsed ? 72 : 280) : 0;

  const logoutButtonClassName = "rounded-full bg-primary-soft px-3 py-2 font-label text-xs text-primary-strong";
  const mobileNavItems = [
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard" as const },
    { href: walletId ? `/wallets/${walletId}` : "/dashboard", label: t("common.wallet"), icon: "wallet" as const },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/dashboard", label: t("common.transactions"), icon: "transactions" as const },
    { href: "/chat", label: t("common.aiAssistant"), icon: "chat" as const },
    { href: "/settings", label: t("common.settings"), icon: "settings" as const }
  ];

  return (
    <div className="flex min-h-screen">
      {/* Desktop fixed sidebar — flex item on desktop, overlay on mobile */}
      {isDesktop ? (
        <div
          className="hidden shrink-0 lg:block"
          style={{ width: desktopSidebarWidth, transition: "width 200ms ease-out" }}
          aria-hidden
        />
      ) : null}

      {/* Actual sidebar (fixed positioned) */}
      {isDesktop ? (
        <UnifiedSidebar
          currentPath={currentPath}
          userName={userName}
          walletId={walletId}
          variant="fixed"
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      ) : null}

      {/* Mobile overlay sidebar */}
      {!isDesktop ? (
        <UnifiedSidebar
          currentPath={currentPath}
          userName={userName}
          walletId={walletId}
          variant="overlay"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <ChangelogPopup />

        {!isDesktop ? (
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className={cn(
              "glass-panel fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-float transition hover:bg-muted hover:text-foreground",
              mobileSidebarOpen ? "bg-primary text-[var(--button-primary-text)] hover:bg-primary-hover" : "text-muted-foreground"
            )}
            aria-label={t("common.menu")}
            aria-expanded={mobileSidebarOpen}
          >
            <AppIcon name="menu" className="h-5 w-5" />
          </button>
        ) : null}

        <main className="page-wrap section-gap">
          <header className="glass-panel mb-4 rounded-[1.25rem] px-4 py-4 backdrop-blur md:px-6 lg:mt-0">
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <p className="pl-14 text-sm text-muted-foreground">{userName}</p>
              <div className="flex items-center gap-2">
                <form action={logout}>
                  <button className={logoutButtonClassName}>{t("common.logout")}</button>
                </form>
              </div>
            </div>
            <p className="eyebrow">{title}</p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className={cn("headline-lg", subtitleClassName)}>{subtitle}</h2>
                  {headerAction ? <div className="shrink-0 md:hidden">{headerAction}</div> : null}
                </div>
                <p className="mt-2 max-w-2xl text-[15px] leading-7 text-muted-foreground sm:text-sm">
                  {t("app.shellHeaderDescription")}
                </p>
                {headerBody ? <div className="mt-5">{headerBody}</div> : null}
              </div>
              {headerAction || !hideDefaultHeaderStats ? (
                <div className={cn("w-full flex-col gap-3 md:w-auto md:items-end", hideDefaultHeaderStats ? "hidden md:flex" : "flex")}>
                  {headerAction ? <div className="hidden md:flex w-full justify-start md:justify-end">{headerAction}</div> : null}
                  {!hideDefaultHeaderStats ? (
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
                  ) : null}
                </div>
              ) : null}
            </div>
            {headerFooter ? <div className="mt-4">{headerFooter}</div> : null}
          </header>

          <div className="pb-24 lg:pb-0">{children}</div>
        </main>

        <nav className="glass-nav fixed inset-x-4 bottom-4 z-40 rounded-2xl px-1.5 py-1.5 backdrop-blur lg:hidden">
          <div className="flex gap-1">
            {mobileNavItems.map((item) => (
              <Link
                key={getNavItemKey(item)}
                href={localizePath(locale, item.href)}
                className={cn(
                  "min-w-0 flex-1 rounded-xl px-1.5 py-1.5 text-center font-label text-[11px] font-medium uppercase tracking-[0.06em] transition",
                  isActivePath(currentPath, item.href) ? "bg-primary text-[var(--button-primary-text)]" : "bg-transparent text-muted-foreground"
                )}
              >
                <span className="flex flex-col items-center justify-center gap-0.5">
                  <AppIcon name={item.icon} className="h-4 w-4" />
                  <span className="truncate">{item.label}</span>
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
