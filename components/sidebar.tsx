"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon } from "@/components/ui/app-icon";
import { AppLocale, getTranslator, localizePath } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { logout } from "@/app/actions/auth";
import type { ReactNode } from "react";

export type NavItemGroup = "keuangan" | "perencanaan" | "pengaturan" | "lainnya";

export type NavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "wallet" | "transactions" | "chat" | "settings" | "savings" | "budgets" | "reports" | "members" | "settlements" | "templates" | "changelog" | "overview" | "category" | "debt";
  group?: NavItemGroup;
};

export const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";
export const SIDEBAR_GROUPS_STORAGE_KEY = "sidebar-groups-collapsed";

export function useCollapsedGroups(): [Record<string, boolean>, (group: string) => void] {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(SIDEBAR_GROUPS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      try {
        localStorage.setItem(SIDEBAR_GROUPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — silently ignore
      }
      return next;
    });
  }, []);

  return [collapsedGroups, toggleGroup];
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(
        "h-3.5 w-3.5 shrink-0 stroke-current transition-transform duration-200",
        collapsed ? "-rotate-90" : "rotate-0"
      )}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function useSidebarState(): [boolean, (collapsed: boolean) => void] {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === "true";
  });

  const setAndPersist = useCallback((value: boolean) => {
    setCollapsed(value);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));
    } catch {
      // localStorage unavailable — silently ignore
    }
  }, []);

  return [collapsed, setAndPersist];
}

function getNavItemKey(item: NavItem) {
  return `${item.icon}:${item.href}`;
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-4 w-4 shrink-0 stroke-current"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={collapsed ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
    </svg>
  );
}

function buildNavItems(t: ReturnType<typeof getTranslator>, walletId: string | null): NavItem[] {
  return [
    // Keuangan
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard", group: "keuangan" },
    { href: walletId ? `/wallets/${walletId}` : "/dashboard", label: t("common.wallet"), icon: "wallet", group: "keuangan" },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/dashboard", label: t("common.transactions"), icon: "transactions", group: "keuangan" },

    // Perencanaan
    { href: walletId ? `/wallets/${walletId}/savings` : "/dashboard", label: t("common.savings"), icon: "savings", group: "perencanaan" },
    { href: walletId ? `/wallets/${walletId}/budgets` : "/dashboard", label: t("common.budgets"), icon: "budgets", group: "perencanaan" },
    { href: walletId ? `/wallets/${walletId}/debts` : "/dashboard", label: t("common.debts"), icon: "debt", group: "perencanaan" },
    { href: walletId ? `/wallets/${walletId}/reports` : "/dashboard", label: t("common.reports"), icon: "reports", group: "perencanaan" },

    // Pengaturan
    { href: walletId ? `/wallets/${walletId}/categories` : "/dashboard", label: t("common.categories"), icon: "category", group: "pengaturan" },
    { href: walletId ? `/wallets/${walletId}/templates` : "/dashboard", label: t("common.templates"), icon: "templates", group: "pengaturan" },
    { href: walletId ? `/wallets/${walletId}/members` : "/dashboard", label: t("common.members"), icon: "members", group: "pengaturan" },
    { href: walletId ? `/wallets/${walletId}/settlements` : "/dashboard", label: t("common.settlements"), icon: "settlements", group: "pengaturan" },
    { href: "/settings", label: t("common.settings"), icon: "settings", group: "pengaturan" },

    // Lainnya
    { href: "/changelogs", label: t("common.changelogs"), icon: "changelog", group: "lainnya" },
    { href: "/chat", label: t("common.aiAssistant"), icon: "chat", group: "lainnya" },
  ];
}

function isActivePath(currentPath: string, href: string) {
  if (href === "/dashboard") {
    return currentPath === "/dashboard" || currentPath === "/wallets";
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function Tooltip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="group/tooltip relative">
      {children}
      <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background opacity-0 shadow-lg transition-opacity group-hover/tooltip:opacity-100">
        {label}
      </span>
    </div>
  );
}

/**
 * Unified sidebar — renders as either a fixed left panel (desktop) or an
 * overlay drawer (mobile), with consistent card-section navigation.
 */
export function UnifiedSidebar({
  currentPath,
  userName,
  walletId,
  variant,
  open,
  onClose,
  collapsed: controlledCollapsed,
  onToggleCollapse,
}: {
  currentPath: string;
  userName: string;
  walletId: string | null;
  variant: "fixed" | "overlay";
  open?: boolean;
  onClose?: () => void;
  /** Optional external collapsed state — when provided, parent manages state */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [internalCollapsed, setInternalCollapsed] = useSidebarState();

  // Use controlled state when provided, fall back to internal
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const handleToggle = onToggleCollapse ?? (() => setInternalCollapsed(!internalCollapsed));
  const navItems = buildNavItems(t, walletId);

  const mobileNavItems: NavItem[] = [
    // Keuangan
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard", group: "keuangan" },
    { href: walletId ? `/wallets/${walletId}` : "/dashboard", label: t("common.wallet"), icon: "wallet", group: "keuangan" },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/dashboard", label: t("common.transactions"), icon: "transactions", group: "keuangan" },

    // Perencanaan
    { href: walletId ? `/wallets/${walletId}/savings` : "/dashboard", label: t("common.savings"), icon: "savings", group: "perencanaan" },
    { href: walletId ? `/wallets/${walletId}/budgets` : "/dashboard", label: t("common.budgets"), icon: "budgets", group: "perencanaan" },
    { href: walletId ? `/wallets/${walletId}/debts` : "/dashboard", label: t("common.debts"), icon: "debt", group: "perencanaan" },
    { href: walletId ? `/wallets/${walletId}/reports` : "/dashboard", label: t("common.reports"), icon: "reports", group: "perencanaan" },

    // Pengaturan
    { href: walletId ? `/wallets/${walletId}/categories` : "/dashboard", label: t("common.categories"), icon: "category", group: "pengaturan" },
    { href: walletId ? `/wallets/${walletId}/templates` : "/dashboard", label: t("common.templates"), icon: "templates", group: "pengaturan" },
    { href: walletId ? `/wallets/${walletId}/members` : "/dashboard", label: t("common.members"), icon: "members", group: "pengaturan" },
    { href: walletId ? `/wallets/${walletId}/settlements` : "/dashboard", label: t("common.settlements"), icon: "settlements", group: "pengaturan" },
    { href: "/settings", label: t("common.settings"), icon: "settings", group: "pengaturan" },

    // Lainnya
    { href: "/changelogs", label: t("common.changelogs"), icon: "changelog", group: "lainnya" },
    { href: "/chat", label: t("common.aiAssistant"), icon: "chat", group: "lainnya" },
  ];

  const mobileWalletShortcuts: NavItem[] = walletId
    ? [
        { href: `/wallets/${walletId}`, label: t("common.overview"), icon: "overview" },
        { href: `/wallets/${walletId}/transactions`, label: t("common.transactions"), icon: "transactions" },
        { href: `/wallets/${walletId}/savings`, label: t("common.savings"), icon: "savings" },
        { href: `/wallets/${walletId}/budgets`, label: t("common.budgets"), icon: "budgets" },
        { href: `/wallets/${walletId}/reports`, label: t("common.reports"), icon: "reports" },
      ]
    : [];

  // ── Overlay variant (mobile drawer) ──────────────────────────────
  if (variant === "overlay") {
    return (
      <>
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
        )}

        {/* Drawer panel */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[min(84vw,20rem)] flex-col border-r border-border bg-card shadow-float transition-transform duration-300 ease-out lg:hidden",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-start justify-between gap-4 px-5 py-5">
            <div className="min-w-0">
              <p className="eyebrow">balance</p>
              <p className="mt-2 text-sm text-muted-foreground">{userName}</p>
            </div>
            <div className="flex items-center gap-2">
              <form action={logout}>
                <button className="rounded-full bg-primary-soft px-3 py-2 font-label text-xs text-primary-strong">
                  {t("common.logout")}
                </button>
              </form>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={t("common.cancel")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="h-4 w-4 stroke-current"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              </button>
            </div>
          </div>

          <SidebarSections
            navItems={mobileNavItems}
            walletShortcuts={mobileWalletShortcuts}
            currentPath={currentPath}
            locale={locale}
            onNavClick={onClose}
          />
        </div>
      </>
    );
  }

  // ── Fixed variant (desktop only) ─────────────────────────────────
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-card transition-[width] duration-200 ease-out lg:flex",
        "border-border shadow-float",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Header area */}
      <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-5">
        <div className={cn("min-w-0", collapsed ? "w-full text-center" : "")}>
          <p className="eyebrow">{collapsed ? "B" : "balance"}</p>
          {!collapsed && (
            <>
              <h1 className="headline-md mt-2">{t("app.shellHeroTitle")}</h1>
              <p className="mt-3 text-sm text-muted-foreground">{userName}</p>
            </>
          )}
        </div>
        {!collapsed && (
          <form action={logout}>
            <button className="rounded-full bg-primary-soft px-3 py-2 font-label text-xs text-primary-strong">
              {t("common.logout")}
            </button>
          </form>
        )}
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "mt-4 flex shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground",
          collapsed ? "mx-auto w-10 h-10" : "mx-4 px-4 py-2"
        )}
        title={collapsed ? t("app.sidebarExpand") : t("app.sidebarCollapse")}
      >
        <SidebarToggleIcon collapsed={collapsed} />
        {!collapsed && (
          <span className="ml-2 text-xs font-label">{t("app.sidebarCollapse")}</span>
        )}
      </button>

      {/* Navigation sections — scrollable */}
      <SidebarSections
        navItems={navItems}
        walletShortcuts={mobileWalletShortcuts}
        currentPath={currentPath}
        locale={locale}
        collapsed={collapsed}
      />

      {/* Logout at bottom when collapsed */}
      {collapsed && (
        <div className="mt-auto flex shrink-0 justify-center px-2 pb-5 pt-4">
          <form action={logout}>
            <button className="rounded-full bg-primary-soft p-2 font-label text-xs text-primary-strong" title={t("common.logout")}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="h-4 w-4 stroke-current"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5.5H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2" />
                <path d="M16 8.5 19.5 12l-3.5 3.5" />
                <path d="M9.5 12h10" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}

/**
 * Reusable navigation sections used by both desktop and mobile sidebar.
 * Shows grouped sections when expanded.
 */
function SidebarSections({
  navItems,
  walletShortcuts,
  currentPath,
  locale,
  collapsed,
  onNavClick,
}: {
  navItems: NavItem[];
  walletShortcuts: NavItem[];
  currentPath: string;
  locale: AppLocale;
  collapsed?: boolean;
  onNavClick?: () => void;
}) {
  const t = getTranslator(locale);
  const [collapsedGroups, toggleGroup] = useCollapsedGroups();

  const renderLink = (item: NavItem) => {
    const itemKey = getNavItemKey(item);
    const active = isActivePath(currentPath, item.href);
    const isWalletShortcut = walletShortcuts.some((s) => s.href === item.href);
    const link = (
      <Link
        key={itemKey}
        href={item.href}
        onClick={onNavClick}
        className={cn(
          "flex items-center gap-3 rounded-lg transition",
          collapsed ? "justify-center px-2 py-3" : "px-4 py-3",
          active && !isWalletShortcut
            ? "bg-muted font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted"
        )}
      >
        <AppIcon
          name={item.icon}
          className="h-4 w-4 shrink-0"
          tone={active ? "primary" : "muted"}
        />
        {!collapsed && !onNavClick && <span className="truncate text-sm">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return <Tooltip key={itemKey} label={item.label}>{link}</Tooltip>;
    }
    return link;
  };

  // Mobile overlay variant uses localizePath and closes on click
  const renderMobileLink = (item: NavItem, variant: "primary" | "card") => {
    const active = isActivePath(currentPath, item.href);
    return (
      <Link
        key={getNavItemKey(item)}
        href={localizePath(locale, item.href)}
        onClick={onNavClick}
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
          variant === "primary"
            ? active
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted"
            : active
              ? "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-hover"
              : "bg-muted text-foreground hover:bg-[color:color-mix(in_srgb,var(--muted)_82%,var(--surface-container-lowest)_18%)] hover:text-foreground"
        )}
      >
        <AppIcon
          name={item.icon}
          className="h-4 w-4"
          tone={variant === "card" && active ? "muted" : variant === "primary" && active ? "primary" : "muted"}
        />
        <span>{item.label}</span>
      </Link>
    );
  };

  // ── Expanded: show grouped sections ──────────────────────────────
  if (!collapsed && !onNavClick) {
    // Group nav items by their group field
    const groupOrder: { key: NavItemGroup; labelKey: string }[] = [
      { key: "keuangan", labelKey: "app.navigationMain" },
      { key: "perencanaan", labelKey: "app.navigationPlanning" },
      { key: "pengaturan", labelKey: "common.settings" },
      { key: "lainnya", labelKey: "app.navigationOther" },
    ];

    const grouped: Partial<Record<NavItemGroup, NavItem[]>> = {};
    for (const item of navItems) {
      const g = item.group ?? "lainnya";
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(item);
    }

    return (
      <nav className="mt-4 flex-1 overflow-y-auto px-4 pb-4">
        {groupOrder.map(({ key, labelKey }) => {
          const items = grouped[key];
          if (!items || items.length === 0) return null;
          const isCollapsed = !!collapsedGroups[key];
          return (
            <div key={key} className="mt-6 first:mt-0">
              <button
                type="button"
                onClick={() => toggleGroup(key)}
                className="flex w-full items-center justify-between text-left font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <span>{t(labelKey)}</span>
                <ChevronIcon collapsed={isCollapsed} />
              </button>
              {!isCollapsed && (
                <div className="mt-3 space-y-2">
                  {items.map(renderLink)}
                </div>
              )}
            </div>
          );
        })}

        {/* Aktif Wallet */}
        {walletShortcuts.length > 0 && (
          <div className="mt-6">
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("app.navigationActiveWallet")}
            </p>
            <div className="mt-3 space-y-2">
              {walletShortcuts.map((item) => {
                const active = isActivePath(currentPath, item.href);
                return (
                  <Link
                    key={getNavItemKey(item)}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition",
                      active
                        ? "bg-primary text-[var(--button-primary-text)] shadow-serene hover:bg-primary-hover"
                        : "bg-muted text-foreground hover:bg-[color:color-mix(in_srgb,var(--muted)_82%,var(--surface-container-lowest)_18%)] hover:text-foreground"
                    )}
                  >
                    <AppIcon name={item.icon} className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    );
  }

  // ── Mobile overlay ───────────────────────────────────────────────
  if (onNavClick) {
    const mobileGroupOrder: { key: NavItemGroup; labelKey: string }[] = [
      { key: "keuangan", labelKey: "app.navigationMain" },
      { key: "perencanaan", labelKey: "app.navigationPlanning" },
      { key: "pengaturan", labelKey: "common.settings" },
      { key: "lainnya", labelKey: "app.navigationOther" },
    ];

    const mobileGrouped: Partial<Record<NavItemGroup, NavItem[]>> = {};
    for (const item of navItems) {
      const g = item.group ?? "lainnya";
      if (!mobileGrouped[g]) mobileGrouped[g] = [];
      mobileGrouped[g].push(item);
    }

    return (
      <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-5 pb-4">
        {mobileGroupOrder.map(({ key, labelKey }) => {
          const items = mobileGrouped[key];
          if (!items || items.length === 0) return null;
          const isCollapsed = !!collapsedGroups[key];
          return (
            <div key={key}>
              <button
                type="button"
                onClick={() => toggleGroup(key)}
                className="flex w-full items-center justify-between text-left font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                <span>{t(labelKey)}</span>
                <ChevronIcon collapsed={isCollapsed} />
              </button>
              {!isCollapsed && (
                <nav className="mt-3 space-y-2">
                  {items.map((item) => renderMobileLink(item, "primary"))}
                </nav>
              )}
            </div>
          );
        })}

        {walletShortcuts.length > 0 && (
          <div>
            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t("app.navigationActiveWallet")}
            </p>
            <nav className="mt-3 space-y-2">
              {walletShortcuts.map((item) => renderMobileLink(item, "card"))}
            </nav>
          </div>
        )}
      </div>
    );
  }

  // ── Desktop collapsed: flat nav, no sections ─────────────────────
  return (
    <nav className="mt-4 flex-1 space-y-2 overflow-y-auto px-2 pb-4">
      {navItems.map(renderLink)}
    </nav>
  );
}

// ── Backward-compatible exports ─────────────────────────────────────
export function Sidebar(props: {
  currentPath: string;
  userName: string;
  walletId: string | null;
}) {
  return <UnifiedSidebar {...props} variant="fixed" />;
}

export function MobileSidebar(props: {
  currentPath: string;
  userName: string;
  walletId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  return <UnifiedSidebar {...props} variant="overlay" />;
}
