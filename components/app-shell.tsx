import Link from "next/link";
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
  const walletId = currentWalletId ?? primaryWalletId;
  const logoutButtonClassName = "rounded-full bg-primary-soft px-3 py-2 font-label text-xs text-primary-strong";
  const mobileUtilityButtonClassName = "rounded-full border border-white/70 bg-white/80 px-3 py-2 font-label text-xs text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]";
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
  const mobileWalletShortcuts = walletId
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
            <div>
              <p className="eyebrow">balance</p>
              <h1 className="headline-md mt-2">Keuangan yang terstruktur menciptakan ketenangan pikiran</h1>
              <p className="mt-3 text-sm text-muted-foreground">{userName}</p>
            </div>
            <form action={logout}>
              <button className={logoutButtonClassName}>Keluar</button>
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
          <header className="mb-4 rounded-[1.25rem] border border-white/60 bg-[rgba(255,255,255,0.68)] px-4 py-4 shadow-serene backdrop-blur md:px-6">
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <p className="text-sm text-muted-foreground">{userName}</p>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <button type="button" className={mobileUtilityButtonClassName}>
                      Menu
                    </button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <p className="eyebrow">Navigasi</p>
                      <SheetTitle>Jelajahi wallet dan halaman utama</SheetTitle>
                      <SheetDescription>Pakai drawer ini untuk pindah ke tujuan wallet yang lebih lengkap tanpa mengganggu bottom navigation utama.</SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6 overflow-y-auto pb-4">
                      <div>
                        <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Utama</p>
                        <nav className="mt-3 space-y-2">
                          {mobileNavItems.map((item) => (
                            <SheetClose key={item.href} asChild>
                              <Link
                                href={item.href}
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
                          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Wallet aktif</p>
                          <nav className="mt-3 space-y-2">
                            {mobileWalletShortcuts.map((item) => (
                              <SheetClose key={item.href} asChild>
                                <Link
                                  href={item.href}
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
                  <button className={logoutButtonClassName}>Keluar</button>
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
                  Cek kondisi keuangan, rapikan catatan, dan jaga ritme finansial tetap tenang setiap hari.
                </p>
                {mobileWalletShortcuts.length > 0 ? (
                  <div className="touch-scroll-x mt-4 flex gap-2 pb-1 pr-1 lg:hidden">
                    {mobileWalletShortcuts.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-full border px-3 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition",
                          isActivePath(currentPath, item.href)
                            ? "border-primary bg-primary text-white"
                            : "border-white/70 bg-white/70 text-muted-foreground"
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
                    <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Wallet</p>
                    <p className="mt-1 metric text-sm">{walletCount}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2 text-center">
                    <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Anggaran</p>
                    <p className="mt-1 metric text-sm">{budgetCount}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2 text-center">
                    <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Anggota</p>
                    <p className="mt-1 metric text-sm">{memberCount}</p>
                  </div>
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
            <Link
              key={item.href}
              href={item.href}
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
