import type { ReactNode } from "react";
import { AppIcon } from "@/components/ui/app-icon";
import { defaultLocale, getTranslator, type AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function getNavItemKey(item: { href: string; icon: Parameters<typeof AppIcon>[0]["name"] }) {
  return `${item.icon}:${item.href}`;
}

function isActivePath(currentPath: string, href: string) {
  if (href === "/dashboard") {
    return currentPath === "/dashboard" || currentPath === "/wallets";
  }

  return currentPath === href || currentPath.startsWith(`${href}/`);
}

function SkeletonBlock({
  className
}: {
  className?: string;
}) {
  return <div className={cn("skeleton-block", className)} aria-hidden="true" />;
}

function AppNavLink({
  href,
  icon,
  label,
  currentPath
}: {
  href: string;
  icon: Parameters<typeof AppIcon>[0]["name"];
  label: string;
  currentPath: string;
}) {
  const active = isActivePath(currentPath, href);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
      )}
    >
      <AppIcon name={icon} className="h-4 w-4" tone={active ? "primary" : "muted"} />
      <span>{label}</span>
    </div>
  );
}

function PageSectionHeading() {
  return (
    <div>
      <SkeletonBlock className="h-3 w-24 rounded-full" />
      <SkeletonBlock className="mt-3 h-7 w-48 sm:w-56" />
    </div>
  );
}

function PageListCards({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-6 stack-list">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="list-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <SkeletonBlock className="h-5 w-40 max-w-[70%]" />
              <SkeletonBlock className="mt-2 h-4 w-full max-w-[18rem]" />
            </div>
            <div className="w-full max-w-[8rem] md:text-right">
              <SkeletonBlock className="ml-auto h-5 w-24" />
              <SkeletonBlock className="mt-2 ml-auto h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card">
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-4 h-10 w-32" />
          <SkeletonBlock className="mt-5 h-4 w-full max-w-[18rem]" />
        </div>
      ))}
    </section>
  );
}

function FormCardSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="card">
      <PageSectionHeading />
      <div className="mt-6 grid gap-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <SkeletonBlock className="mb-2 h-4 w-28 rounded-full" />
            <SkeletonBlock className="h-[3.25rem] w-full rounded-2xl" />
          </div>
        ))}
        <SkeletonBlock className="mt-1 h-12 w-full rounded-full sm:w-40" />
      </div>
    </div>
  );
}

function PublicPageShell({ children, fullHeight = false }: { children: ReactNode; fullHeight?: boolean }) {
  return <main className={cn("page-wrap", fullHeight ? "flex min-h-screen items-center py-10" : "section-gap")}>{children}</main>;
}

function AppShellSkeleton({
  currentPath,
  title,
  locale = defaultLocale,
  walletContext = false,
  children,
  headerBody,
  headerFooter,
  hideDefaultHeaderStats = false
}: {
  currentPath: string;
  title: string;
  locale?: AppLocale;
  walletContext?: boolean;
  children: ReactNode;
  headerBody?: ReactNode;
  headerFooter?: ReactNode;
  hideDefaultHeaderStats?: boolean;
}) {
  const t = getTranslator(locale);
  const walletId = walletContext ? "loading-wallet" : null;
  const navItems = [
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard" as const },
    { href: walletId ? `/wallets/${walletId}` : "/dashboard", label: t("common.wallet"), icon: "wallet" as const },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/dashboard", label: t("common.transactions"), icon: "transactions" as const },
    { href: walletId ? `/wallets/${walletId}/savings` : "/dashboard", label: t("common.savings"), icon: "savings" as const },
    { href: walletId ? `/wallets/${walletId}/budgets` : "/dashboard", label: t("common.budgets"), icon: "budgets" as const },
    { href: walletId ? `/wallets/${walletId}/categories` : "/dashboard", label: t("common.categories"), icon: "category" as const },
    { href: walletId ? `/wallets/${walletId}/reports` : "/dashboard", label: t("common.reports"), icon: "reports" as const },
    { href: walletId ? `/wallets/${walletId}/members` : "/dashboard", label: t("common.members"), icon: "members" as const },
    { href: walletId ? `/wallets/${walletId}/settlements` : "/dashboard", label: t("common.settlements"), icon: "settlements" as const },
    { href: walletId ? `/wallets/${walletId}/templates` : "/dashboard", label: t("common.templates"), icon: "templates" as const }
  ];
  const mobileNavItems = [
    { href: "/dashboard", label: t("common.dashboard"), icon: "dashboard" as const },
    { href: walletId ? `/wallets/${walletId}` : "/dashboard", label: t("common.wallet"), icon: "wallet" as const },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/dashboard", label: t("common.transactions"), icon: "transactions" as const },
    { href: "/chat", label: t("common.aiAssistant"), icon: "chat" as const },
    { href: "/settings", label: t("common.settings"), icon: "settings" as const }
  ];
  const shortcuts = walletId
    ? [
        { href: `/wallets/${walletId}`, label: t("common.overview"), icon: "overview" as const },
        { href: `/wallets/${walletId}/transactions`, label: t("common.transactions"), icon: "transactions" as const },
        { href: `/wallets/${walletId}/savings`, label: t("common.savings"), icon: "savings" as const },
        { href: `/wallets/${walletId}/budgets`, label: t("common.budgets"), icon: "budgets" as const },
        { href: `/wallets/${walletId}/reports`, label: t("common.reports"), icon: "reports" as const }
      ]
    : [];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar spacer for desktop */}
      <div className="hidden w-[280px] shrink-0 lg:block" aria-hidden />

      {/* Sidebar skeleton */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-border bg-card shadow-float lg:flex">
        <div className="flex items-start justify-between gap-2 px-4 pt-5">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">balance</p>
            <SkeletonBlock className="mt-4 h-6 w-full max-w-[13rem]" />
            <SkeletonBlock className="mt-2 h-6 w-full max-w-[12rem]" />
            <SkeletonBlock className="mt-4 h-4 w-24" />
          </div>
          <SkeletonBlock className="h-9 w-20 rounded-full" />
        </div>
        <nav className="mt-8 flex-1 space-y-2 overflow-y-auto px-4 pb-4">
          {navItems.map((item) => (
            <AppNavLink key={getNavItemKey(item)} currentPath={currentPath} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="glass-panel fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-float lg:hidden">
          <AppIcon name="menu" className="h-5 w-5" />
        </div>

        <main className="page-wrap section-gap">
          <header className="glass-panel mb-4 rounded-[1.25rem] px-4 py-4 backdrop-blur md:px-6">
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <SkeletonBlock className="h-4 w-32 ml-14" />
              <SkeletonBlock className="h-9 w-20 rounded-full" />
            </div>
            <p className="eyebrow">{title}</p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-9 w-full max-w-[18rem]" />
                <SkeletonBlock className="mt-3 h-4 w-full max-w-[28rem]" />
                <SkeletonBlock className="mt-2 h-4 w-full max-w-[24rem]" />
                {headerBody ? <div className="mt-5">{headerBody}</div> : null}
                {shortcuts.length > 0 ? (
                  <div className="touch-scroll-x mt-4 flex gap-2 pb-1 pr-1 lg:hidden">
                    {shortcuts.map((item) => {
                      const active = isActivePath(currentPath, item.href);

                      return (
                        <div
                          key={getNavItemKey(item)}
                          className={cn(
                            "shrink-0 whitespace-nowrap rounded-full border px-3 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em]",
                            active
                              ? "border-primary bg-primary text-[var(--button-primary-text)]"
                              : "glass-panel border text-muted-foreground"
                          )}
                        >
                          <span className="inline-flex items-center gap-2">
                            <AppIcon name={item.icon} className="h-3.5 w-3.5" />
                            <span>{item.label}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <div className={cn("w-full flex-col gap-3 md:w-auto md:items-end", hideDefaultHeaderStats ? "hidden md:flex" : "flex")}>
                <SkeletonBlock className="h-11 w-full rounded-full md:w-36" />
                {!hideDefaultHeaderStats ? (
                  <div className="grid w-full max-w-sm grid-cols-3 gap-2 rounded-xl bg-card p-2 shadow-serene md:w-auto">
                    {[t("common.wallet"), t("common.budgets"), t("common.members")].map((label) => (
                      <div key={label} className="rounded-lg bg-muted px-3 py-2 text-center">
                        <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                        <SkeletonBlock className="mx-auto mt-2 h-6 w-10" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            {headerFooter ? <div className="mt-4">{headerFooter}</div> : null}
          </header>

          <div className="pb-24 lg:pb-0">{children}</div>
        </main>

        <nav className="glass-nav fixed inset-x-4 bottom-4 z-40 rounded-2xl p-2 backdrop-blur lg:hidden">
          <div className="touch-scroll-x flex gap-2">
            {mobileNavItems.map((item) => (
              <div
                key={getNavItemKey(item)}
                className={cn(
                  "min-w-[calc(50%-0.25rem)] flex-1 rounded-xl px-2 py-2 text-center font-label text-[11px] font-semibold uppercase tracking-[0.12em]",
                  isActivePath(currentPath, item.href) ? "bg-primary text-[var(--button-primary-text)]" : "text-muted-foreground"
                )}
              >
                <span className="flex flex-col items-center justify-center gap-1">
                  <AppIcon name={item.icon} className="h-4 w-4" />
                  <span>{item.label}</span>
                </span>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function AppAreaLoadingSkeleton({ locale = defaultLocale }: { locale?: AppLocale }) {
  return (
    <AppShellSkeleton currentPath="/dashboard" title={getTranslator(locale)("common.dashboard")} locale={locale} walletContext>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <PageSectionHeading />
          <SkeletonBlock className="mt-6 h-32 w-full" />
        </div>
        <div className="card">
          <PageSectionHeading />
          <PageListCards count={2} />
        </div>
      </section>
    </AppShellSkeleton>
  );
}

export function DashboardLoadingSkeleton({ locale = defaultLocale }: { locale?: AppLocale }) {
  return (
    <AppShellSkeleton
      currentPath="/dashboard"
      title={getTranslator(locale)("common.dashboard")}
      locale={locale}
      hideDefaultHeaderStats
      headerBody={
        <div className="max-w-3xl">
          <SkeletonBlock className="h-4 w-28 rounded-full" />
          <SkeletonBlock className="mt-3 h-12 w-full max-w-[18rem] sm:h-14 md:h-16 md:max-w-[20rem]" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-[26rem]" />
          <SkeletonBlock className="mt-2 h-4 w-full max-w-[22rem]" />
        </div>
      }
      headerFooter={
        <div className="grid gap-2 rounded-[1rem] bg-card p-2 shadow-serene sm:grid-cols-3">
          {[getTranslator(locale)("common.wallet"), getTranslator(locale)("common.budgets"), getTranslator(locale)("common.members")].map((label) => (
            <div key={label} className="rounded-lg bg-muted px-3 py-2 text-center">
              <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <SkeletonBlock className="mx-auto mt-2 h-6 w-10" />
            </div>
          ))}
        </div>
      }
    >
      <section className="card">
        <PageSectionHeading />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </section>

      <section className="mt-4">
        <StatGridSkeleton count={5} />
      </section>

      <section className="mt-4 overflow-hidden rounded-[1.4rem] border border-[color:var(--soft-border)] bg-[linear-gradient(135deg,var(--primary-soft),color-mix(in_srgb,var(--card)_82%,var(--primary-soft)_18%))] p-5 shadow-serene">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="mt-3 h-7 w-full max-w-[16rem]" />
          </div>
          <SkeletonBlock className="h-11 w-11 rounded-2xl" />
        </div>
        <div className="mt-5 space-y-3">
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
        <SkeletonBlock className="mt-5 h-10 w-32 rounded-full" />
      </section>

      <section className="mt-4 card">
        <PageSectionHeading />
        <SkeletonBlock className="mt-6 h-72 w-full rounded-2xl" />
      </section>

      <section className="mt-4">
        <FormCardSkeleton fields={4} />
      </section>

      <section className="mt-4 grid gap-4 2xl:grid-cols-12">
        <div className="card 2xl:col-span-7">
          <PageSectionHeading />
          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(17rem,1fr))] gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="relative overflow-hidden rounded-[1.4rem] border bg-card p-4">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_left,rgba(224,231,187,0.9),transparent_58%)] opacity-80" />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                    <div className="min-w-0 flex-1">
                      <SkeletonBlock className="h-5 w-32" />
                      <SkeletonBlock className="mt-2 h-4 w-24" />
                    </div>
                  </div>
                  <SkeletonBlock className="h-7 w-20 rounded-full" />
                </div>
                <div className="mt-5 rounded-[1.25rem] border border-[color:var(--soft-border)] p-4">
                  <SkeletonBlock className="h-4 w-24" />
                  <SkeletonBlock className="mt-2 h-9 w-40" />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <SkeletonBlock className="h-20 w-full rounded-xl" />
                  <SkeletonBlock className="h-20 w-full rounded-xl" />
                </div>
                <div className="mt-5 rounded-[1.25rem] border border-[color:var(--soft-border)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <SkeletonBlock className="h-4 w-20" />
                    <SkeletonBlock className="h-5 w-10" />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <SkeletonBlock className="h-4 w-20" />
                      <SkeletonBlock className="mt-2 h-5 w-24" />
                    </div>
                    <SkeletonBlock className="h-4 w-28" />
                  </div>
                  <SkeletonBlock className="mt-3 h-2 w-full rounded-full" />
                </div>
                <SkeletonBlock className="mt-5 h-12 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="card 2xl:col-span-5">
          <PageSectionHeading />
          <PageListCards />
        </div>
      </section>

      <section className="mt-4 card">
        <PageSectionHeading />
        <PageListCards />
      </section>
    </AppShellSkeleton>
  );
}

export function WalletsLoadingSkeleton({ locale = defaultLocale }: { locale?: AppLocale }) {
  return (
    <AppShellSkeleton currentPath="/wallets" title={getTranslator(locale)("common.wallet")} locale={locale}>
      <section className="glass-panel mb-4 grid gap-4 rounded-2xl p-4 xl:grid-cols-[1fr_360px]">
        <div>
          <SkeletonBlock className="h-7 w-full max-w-[20rem]" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-[26rem]" />
          <SkeletonBlock className="mt-2 h-4 w-full max-w-[18rem]" />
        </div>
        <div className="grid gap-3 rounded-2xl bg-muted p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <SkeletonBlock className="h-[3.25rem] w-full rounded-2xl" />
            <SkeletonBlock className="h-[3.25rem] w-full rounded-2xl" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SkeletonBlock className="h-[3.25rem] w-full rounded-2xl" />
            <SkeletonBlock className="h-[3.25rem] w-full rounded-2xl" />
          </div>
          <SkeletonBlock className="h-4 w-full max-w-[18rem]" />
          <SkeletonBlock className="h-12 w-full rounded-full" />
        </div>
      </section>

      <section className="wallet-grid">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="card flex h-full flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-6 w-36" />
                <SkeletonBlock className="mt-2 h-4 w-24" />
              </div>
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="mt-6 h-4 w-24" />
            <SkeletonBlock className="mt-2 h-10 w-40" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SkeletonBlock className="h-24 w-full rounded-xl" />
              <SkeletonBlock className="h-24 w-full rounded-xl" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <SkeletonBlock className="h-20 w-full rounded-xl" />
              <SkeletonBlock className="h-20 w-full rounded-xl" />
              <SkeletonBlock className="h-20 w-full rounded-xl" />
            </div>
            <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
            <div className="mt-3 flex gap-3">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
            <SkeletonBlock className="mt-6 h-12 w-full rounded-full" />
          </article>
        ))}
      </section>
    </AppShellSkeleton>
  );
}

export function WalletOverviewLoadingSkeleton({ locale = defaultLocale }: { locale?: AppLocale }) {
  return (
    <AppShellSkeleton currentPath="/wallets/loading-wallet" title={getTranslator(locale)("common.wallet")} locale={locale} walletContext>
      <StatGridSkeleton count={5} />
      <section className="mt-4 wallet-grid">
        <div className="card md:col-span-2">
          <PageSectionHeading />
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="card">
          <PageSectionHeading />
          <PageListCards />
        </div>
      </section>
    </AppShellSkeleton>
  );
}

export function FormListLoadingSkeleton({
  currentPath,
  title,
  locale = defaultLocale,
  formFields = 5,
  listCount = 3
}: {
  currentPath: string;
  title: string;
  locale?: AppLocale;
  formFields?: number;
  listCount?: number;
}) {
  return (
    <AppShellSkeleton currentPath={currentPath} title={title} locale={locale} walletContext>
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <FormCardSkeleton fields={formFields} />
        <div className="card">
          <PageSectionHeading />
          <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <SkeletonBlock className="h-[3.25rem] w-full rounded-2xl sm:max-w-[11rem]" />
            <SkeletonBlock className="h-12 w-full rounded-full sm:w-28" />
            <SkeletonBlock className="h-12 w-full rounded-full sm:w-28" />
          </div>
          <PageListCards count={listCount} />
        </div>
      </section>
    </AppShellSkeleton>
  );
}

export function DetailPageLoadingSkeleton({
  currentPath,
  title,
  locale = defaultLocale,
  stats = false,
  chart = false
}: {
  currentPath: string;
  title: string;
  locale?: AppLocale;
  stats?: boolean;
  chart?: boolean;
}) {
  return (
    <AppShellSkeleton currentPath={currentPath} title={title} locale={locale} walletContext>
      {stats ? (
        <section className="grid gap-4 md:grid-cols-3">
          <SkeletonBlock className="card h-28 w-full" />
          <SkeletonBlock className="card h-28 w-full" />
          <SkeletonBlock className="card h-28 w-full" />
        </section>
      ) : null}
      <section className={cn("grid gap-4", stats ? "mt-4" : "", chart ? "lg:grid-cols-[1.15fr_0.85fr]" : "xl:grid-cols-[0.9fr_1.1fr]")}>
        <div className="card">
          <PageSectionHeading />
          {chart ? (
            <div className="mt-8 grid min-h-[18rem] grid-cols-5 items-end gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-3">
                  <div className="flex h-56 items-end gap-2">
                    <SkeletonBlock className="h-24 w-4 rounded-full sm:w-5" />
                    <SkeletonBlock className="h-40 w-4 rounded-full sm:w-5" />
                  </div>
                  <SkeletonBlock className="h-4 w-10" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <SkeletonBlock className="h-28 w-full rounded-xl" />
                <SkeletonBlock className="h-28 w-full rounded-xl" />
              </div>
              <PageListCards />
            </div>
          )}
        </div>
        <div className="card">
          <PageSectionHeading />
          <PageListCards />
        </div>
      </section>
    </AppShellSkeleton>
  );
}

export function MarketingHomeLoadingSkeleton() {
  return (
    <PublicPageShell>
      <section className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:py-14">
        <div>
          <SkeletonBlock className="h-3 w-52 rounded-full" />
          <SkeletonBlock className="mt-5 h-12 w-full max-w-[42rem]" />
          <SkeletonBlock className="mt-3 h-12 w-full max-w-[36rem]" />
          <SkeletonBlock className="mt-6 h-4 w-full max-w-[34rem]" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-[30rem]" />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <SkeletonBlock className="h-12 w-full rounded-full sm:w-36" />
            <SkeletonBlock className="h-12 w-full rounded-full sm:w-28" />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-8 w-32 rounded-full" />
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="card-muted p-4">
                <SkeletonBlock className="h-3 w-16 rounded-full" />
                <SkeletonBlock className="mt-4 h-4 w-full max-w-[10rem]" />
                <SkeletonBlock className="mt-2 h-4 w-full max-w-[8rem]" />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel-strong relative overflow-hidden rounded-[2rem] p-4 shadow-float md:p-6">
          <div className="rounded-[1.5rem] bg-primary/85 px-5 py-6">
            <SkeletonBlock className="h-3 w-32 rounded-full bg-white/20" />
            <SkeletonBlock className="mt-5 h-10 w-40 bg-white/20" />
            <SkeletonBlock className="mt-4 h-4 w-full max-w-[18rem] bg-white/20" />
            <SkeletonBlock className="mt-2 h-4 w-full max-w-[16rem] bg-white/20" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SkeletonBlock className="card h-36 w-full" />
            <SkeletonBlock className="card h-36 w-full" />
          </div>
          <SkeletonBlock className="mt-4 h-40 w-full rounded-[1.5rem]" />
        </div>
      </section>

      <section className="section-gap">
        <SkeletonBlock className="h-3 w-40 rounded-full" />
        <SkeletonBlock className="mt-4 h-9 w-full max-w-[34rem]" />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card">
              <SkeletonBlock className="h-6 w-full max-w-[16rem]" />
              <SkeletonBlock className="mt-4 h-4 w-full max-w-[20rem]" />
              <SkeletonBlock className="mt-2 h-4 w-full max-w-[18rem]" />
            </div>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
}

export function AuthPageLoadingSkeleton() {
  return (
    <PublicPageShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="card-muted min-h-[24rem] rounded-[1.75rem] p-6 md:p-8">
          <SkeletonBlock className="h-3 w-40 rounded-full" />
          <SkeletonBlock className="mt-5 h-10 w-full max-w-[22rem]" />
          <SkeletonBlock className="mt-3 h-4 w-full max-w-[24rem]" />
          <SkeletonBlock className="mt-2 h-4 w-full max-w-[20rem]" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </section>

        <section className="card min-w-0">
          <div className="mx-auto min-w-0 max-w-md">
            <SkeletonBlock className="h-3 w-20 rounded-full" />
            <SkeletonBlock className="mt-4 h-8 w-36" />
            <SkeletonBlock className="mt-4 h-4 w-full max-w-[22rem]" />
            <div className="mt-8 space-y-4">
              <SkeletonBlock className="h-12 w-full rounded-full" />
              <SkeletonBlock className="h-4 w-full max-w-[16rem]" />
            </div>
            <div className="mt-8 grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index}>
                  <SkeletonBlock className="mb-2 h-4 w-24 rounded-full" />
                  <SkeletonBlock className="h-[3.25rem] w-full rounded-2xl" />
                </div>
              ))}
            </div>
            <SkeletonBlock className="mt-6 h-12 w-full rounded-full" />
            <SkeletonBlock className="mt-4 h-4 w-40" />
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}

export function InvitePageLoadingSkeleton() {
  return (
    <PublicPageShell>
      <div className="mx-auto max-w-2xl">
        <section className="card">
          <SkeletonBlock className="h-8 w-32 rounded-full" />
          <SkeletonBlock className="mt-5 h-8 w-full max-w-[20rem]" />
          <SkeletonBlock className="mt-4 h-4 w-full max-w-[28rem]" />
          <SkeletonBlock className="mt-2 h-4 w-full max-w-[22rem]" />
          <div className="mt-8 grid gap-3">
            <SkeletonBlock className="h-20 w-full rounded-2xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              <SkeletonBlock className="h-12 w-full rounded-full" />
              <SkeletonBlock className="h-12 w-full rounded-full" />
            </div>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}

export function SimpleCardLoadingSkeleton({
  eyebrowWidth = "w-24",
  titleWidth = "w-56",
  bodyLines = 2,
  fullHeight = false
}: {
  eyebrowWidth?: string;
  titleWidth?: string;
  bodyLines?: number;
  fullHeight?: boolean;
}) {
  return (
    <PublicPageShell fullHeight={fullHeight}>
      <section className="glass-panel-strong mx-auto w-full max-w-2xl rounded-[2rem] p-6 shadow-float md:p-10">
        <SkeletonBlock className={cn("h-3 rounded-full", eyebrowWidth)} />
        <SkeletonBlock className={cn("mt-5 h-9 max-w-full", titleWidth)} />
        <div className="mt-5 space-y-3">
          {Array.from({ length: bodyLines }).map((_, index) => (
            <SkeletonBlock key={index} className="h-4 w-full max-w-[32rem]" />
          ))}
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SkeletonBlock className="h-28 w-full rounded-[1.5rem]" />
          <SkeletonBlock className="h-28 w-full rounded-[1.5rem]" />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <SkeletonBlock className="h-12 w-full rounded-full sm:w-32" />
          <SkeletonBlock className="h-12 w-full rounded-full sm:w-28" />
        </div>
      </section>
    </PublicPageShell>
  );
}
