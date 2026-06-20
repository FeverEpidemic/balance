"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { ChangelogPopup } from "@/components/features/changelogs/changelog-popup";
import { UnifiedSidebar, useSidebarState } from "@/components/sidebar";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon } from "@/components/ui/app-icon";
import { getTranslator, localizePath } from "@/lib/i18n";
import {
  createMobileNavScrollState,
  expandMobileNavScrollState,
  updateMobileNavScrollState
} from "@/lib/mobile-nav";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { TransactionCreateContext } from "@/lib/data";
import { TransactionCreateDialogButton } from "@/components/features/transactions/transaction-create-dialog-button";

type MobileNavItem = {
  href: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
  label: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function getNavItemKey(item: MobileNavItem) {
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
  hideDefaultHeaderStats = false,
  fabTransactionContext,
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
  fabTransactionContext?: TransactionCreateContext;
}) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const walletId = currentWalletId ?? primaryWalletId;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useSidebarState();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobileNavCompact, setIsMobileNavCompact] = useState(false);
  const mobileNavScrollStateRef = useRef(createMobileNavScrollState());

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

  useEffect(() => {
    if (isDesktop) {
      mobileNavScrollStateRef.current = createMobileNavScrollState();
      setIsMobileNavCompact(false);
      return;
    }

    mobileNavScrollStateRef.current = createMobileNavScrollState(window.scrollY);
    setIsMobileNavCompact(false);

    const handleScroll = () => {
      const nextState = updateMobileNavScrollState(mobileNavScrollStateRef.current, window.scrollY);
      mobileNavScrollStateRef.current = nextState;
      setIsMobileNavCompact((currentValue) => (currentValue === nextState.isCompact ? currentValue : nextState.isCompact));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPath, isDesktop]);

  // Sidebar width used by the flex layout
  const desktopSidebarWidth = isDesktop ? (sidebarCollapsed ? 72 : 280) : 0;

  const logoutButtonClassName = "rounded-full bg-primary-soft px-3 py-2 font-label text-xs text-primary-strong";
  const mobileNavItems = [
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard" as const },
    { href: walletId ? `/wallets/${walletId}` : "/dashboard", label: t("common.wallet"), icon: "wallet" as const },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/dashboard", label: t("common.transactions"), icon: "transactions" as const },
    { href: "/chat", label: t("common.aiAssistant"), icon: "chat" as const },
  ];

  const handleMobileNavInteraction = () => {
    if (isDesktop || !mobileNavScrollStateRef.current.isCompact) {
      return;
    }

    const nextState = expandMobileNavScrollState(mobileNavScrollStateRef.current, window.scrollY);

    mobileNavScrollStateRef.current = nextState;
    setIsMobileNavCompact(false);
  };

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
              <p className="pl-14 text-sm text-muted-foreground">
                {getGreeting()}, {userName} ☀️
              </p>
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
                  {headerAction && !fabTransactionContext ? <div className="shrink-0 md:hidden">{headerAction}</div> : null}
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

          <div className="pb-20 lg:pb-0">{children}</div>
        </main>

        <nav className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
          <div
            className={cn(
              "glass-nav mx-auto w-full overflow-hidden backdrop-blur transition-[max-width,padding,border-radius,transform,background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
              isMobileNavCompact ? "max-w-[16rem] translate-y-[1px] rounded-full px-1 py-0.5" : "max-w-full translate-y-0 rounded-2xl px-1 py-1"
            )}
            onPointerDownCapture={handleMobileNavInteraction}
            onFocusCapture={handleMobileNavInteraction}
          >
            <div
              className={cn(
                "flex w-full flex-row items-stretch transition-[gap] duration-200 ease-out motion-reduce:transition-none",
                isMobileNavCompact ? "gap-0.5" : "gap-1"
              )}
            >
              {mobileNavItems.map((item) => {
                const isActive = isActivePath(currentPath, item.href);

                return (
                  <Link
                    key={getNavItemKey(item)}
                    href={localizePath(locale, item.href)}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    className={cn(
                      "block min-w-0 basis-0 flex-1 text-center font-label text-[10px] font-medium uppercase tracking-[0.06em] transition-[min-height,padding,color,background-color,border-radius] duration-200 ease-out motion-reduce:transition-none",
                      isMobileNavCompact ? "min-h-[2.125rem] rounded-full px-0.5 py-0.5" : "min-h-[3rem] rounded-xl px-1 py-1.5",
                      isActive ? "bg-primary text-[var(--button-primary-text)]" : "bg-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-full flex-col items-center justify-center transition-[gap] duration-200 ease-out motion-reduce:transition-none",
                        isMobileNavCompact ? "gap-0" : "gap-0.5"
                      )}
                    >
                      <AppIcon
                        name={item.icon}
                        tone="inherit"
                        className={cn(
                          "transition-[width,height,transform] duration-200 ease-out motion-reduce:transition-none",
                          isMobileNavCompact ? "h-4 w-4" : "h-3.5 w-3.5"
                        )}
                      />
                      <span
                        className={cn(
                          "w-full overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out motion-reduce:translate-y-0 motion-reduce:transition-none",
                          isMobileNavCompact ? "max-h-0 -translate-y-1 opacity-0" : "max-h-4 translate-y-0 opacity-100"
                        )}
                      >
                        <span className="block truncate leading-none">{item.label}</span>
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        {/* FAB — replaces mobile header button */}
        {!isDesktop && fabTransactionContext ? (
          <div className="fixed bottom-24 right-5 z-40 lg:hidden">
            <TransactionCreateDialogButton
              context={fabTransactionContext}
              label=""
              iconOnly
            />
          </div>
        ) : null}
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
