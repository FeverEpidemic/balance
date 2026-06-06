import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function isActivePath(currentPath: string, href: string) {
  if (href === "/wallets") {
    return currentPath === "/wallets" || currentPath.startsWith("/wallets/");
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
  label,
  currentPath
}: {
  href: string;
  label: string;
  currentPath: string;
}) {
  const active = isActivePath(currentPath, href);

  return (
    <div
      className={cn(
        "block rounded-lg px-4 py-3 text-sm transition",
        active ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
      )}
    >
      {label}
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
  walletContext = false,
  children
}: {
  currentPath: string;
  title: string;
  walletContext?: boolean;
  children: ReactNode;
}) {
  const walletId = walletContext ? "loading-wallet" : null;
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/wallets", label: "Wallet" },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/wallets", label: "Transaksi" },
    { href: walletId ? `/wallets/${walletId}/savings` : "/wallets", label: "Tabungan" },
    { href: walletId ? `/wallets/${walletId}/budgets` : "/wallets", label: "Anggaran" },
    { href: walletId ? `/wallets/${walletId}/reports` : "/wallets", label: "Laporan" },
    { href: walletId ? `/wallets/${walletId}/members` : "/wallets", label: "Anggota" },
    { href: walletId ? `/wallets/${walletId}/settlements` : "/wallets", label: "Pelunasan" },
    { href: walletId ? `/wallets/${walletId}/templates` : "/wallets", label: "Template" }
  ];
  const mobileNavItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/wallets", label: "Wallet" },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/wallets", label: "Transaksi" },
    { href: walletId ? `/wallets/${walletId}/reports` : "/wallets", label: "Laporan" }
  ];
  const shortcuts = walletId
    ? [
        { href: `/wallets/${walletId}`, label: "Ringkasan" },
        { href: `/wallets/${walletId}/transactions`, label: "Transaksi" },
        { href: `/wallets/${walletId}/savings`, label: "Tabungan" },
        { href: `/wallets/${walletId}/recurring`, label: "Otomatis" },
        { href: `/wallets/${walletId}/budgets`, label: "Anggaran" },
        { href: `/wallets/${walletId}/reports`, label: "Laporan" },
        { href: `/wallets/${walletId}/members`, label: "Anggota" },
        { href: `/wallets/${walletId}/settlements`, label: "Pelunasan" },
        { href: `/wallets/${walletId}/templates`, label: "Template" }
      ]
    : [];

  return (
    <div className="page-wrap section-gap">
      <div className="app-grid">
        <aside className="card hidden h-fit lg:block">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="eyebrow">balance</p>
              <SkeletonBlock className="mt-4 h-6 w-full max-w-[13rem]" />
              <SkeletonBlock className="mt-2 h-6 w-full max-w-[12rem]" />
              <SkeletonBlock className="mt-4 h-4 w-24" />
            </div>
            <SkeletonBlock className="h-9 w-20 rounded-full" />
          </div>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <AppNavLink key={item.href} currentPath={currentPath} href={item.href} label={item.label} />
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="mb-4 rounded-[1.25rem] border border-white/60 bg-[rgba(255,255,255,0.68)] px-4 py-4 shadow-serene backdrop-blur md:px-6">
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-9 w-20 rounded-full" />
            </div>
            <p className="eyebrow">{title}</p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-9 w-full max-w-[18rem]" />
                <SkeletonBlock className="mt-3 h-4 w-full max-w-[28rem]" />
                <SkeletonBlock className="mt-2 h-4 w-full max-w-[24rem]" />
                {shortcuts.length > 0 ? (
                  <div className="touch-scroll-x mt-4 flex gap-2 pb-1 pr-1 lg:hidden">
                    {shortcuts.map((item) => {
                      const active = isActivePath(currentPath, item.href);

                      return (
                        <div
                          key={item.href}
                          className={cn(
                            "shrink-0 whitespace-nowrap rounded-full border px-3 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em]",
                            active
                              ? "border-primary bg-primary text-white"
                              : "border-white/70 bg-white/70 text-muted-foreground"
                          )}
                        >
                          {item.label}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                <SkeletonBlock className="h-11 w-full rounded-full md:w-36" />
                <div className="grid w-full max-w-sm grid-cols-3 gap-2 rounded-xl bg-card p-2 shadow-serene md:w-auto">
                  {["Wallet", "Anggaran", "Anggota"].map((label) => (
                    <div key={label} className="rounded-lg bg-muted px-3 py-2 text-center">
                      <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                      <SkeletonBlock className="mx-auto mt-2 h-6 w-10" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </header>

          <div className="pb-24 lg:pb-0">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.86)] p-2 shadow-float backdrop-blur lg:hidden">
        <div className="touch-scroll-x flex gap-2">
          {mobileNavItems.map((item) => (
            <div
              key={item.href}
              className={cn(
                "min-w-[calc(50%-0.25rem)] flex-1 rounded-xl px-2 py-3 text-center font-label text-[11px] font-semibold uppercase tracking-[0.12em]",
                isActivePath(currentPath, item.href) ? "bg-primary text-white" : "text-muted-foreground"
              )}
            >
              {item.label}
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function AppAreaLoadingSkeleton() {
  return (
    <AppShellSkeleton currentPath="/dashboard" title="Memuat" walletContext>
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

export function DashboardLoadingSkeleton() {
  return (
    <AppShellSkeleton currentPath="/dashboard" title="Dashboard">
      <StatGridSkeleton />
      <section className="mt-4 grid gap-4 2xl:grid-cols-12">
        <div className="card 2xl:col-span-7">
          <PageSectionHeading />
          <div className="mt-6 grid gap-4 xl:grid-cols-2 min-[1700px]:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="info-tile">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="mt-2 h-4 w-24" />
                <SkeletonBlock className="mt-5 h-9 w-36" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <SkeletonBlock className="h-20 w-full rounded-xl" />
                  <SkeletonBlock className="h-20 w-full rounded-xl" />
                </div>
                <SkeletonBlock className="mt-4 h-2 w-full rounded-full" />
                <div className="mt-3 flex gap-3">
                  <SkeletonBlock className="h-4 w-20" />
                  <SkeletonBlock className="h-4 w-28" />
                </div>
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

export function WalletsLoadingSkeleton() {
  return (
    <AppShellSkeleton currentPath="/wallets" title="Wallet">
      <section className="mb-4 grid gap-4 rounded-2xl bg-white/75 p-4 shadow-serene xl:grid-cols-[1fr_360px]">
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
          <article key={index} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-6 w-36" />
                <SkeletonBlock className="mt-2 h-4 w-24" />
              </div>
              <SkeletonBlock className="h-7 w-20 rounded-full" />
            </div>
            <SkeletonBlock className="mt-6 h-10 w-40" />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SkeletonBlock className="h-24 w-full rounded-xl" />
              <SkeletonBlock className="h-24 w-full rounded-xl" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <SkeletonBlock className="h-20 w-full rounded-xl" />
              <SkeletonBlock className="h-20 w-full rounded-xl" />
              <SkeletonBlock className="h-20 w-full rounded-xl" />
            </div>
            <SkeletonBlock className="mt-6 h-12 w-full rounded-full" />
          </article>
        ))}
      </section>
    </AppShellSkeleton>
  );
}

export function WalletOverviewLoadingSkeleton() {
  return (
    <AppShellSkeleton currentPath="/wallets/loading-wallet" title="Wallet" walletContext>
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
  formFields = 5,
  listCount = 3
}: {
  currentPath: string;
  title: string;
  formFields?: number;
  listCount?: number;
}) {
  return (
    <AppShellSkeleton currentPath={currentPath} title={title} walletContext>
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
  stats = false,
  chart = false
}: {
  currentPath: string;
  title: string;
  stats?: boolean;
  chart?: boolean;
}) {
  return (
    <AppShellSkeleton currentPath={currentPath} title={title} walletContext>
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

        <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,244,237,0.98))] p-4 shadow-float md:p-6">
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
      <section className="mx-auto w-full max-w-2xl rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,244,237,0.98))] p-6 shadow-float md:p-10">
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
