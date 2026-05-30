import Link from "next/link";
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
  currentWalletId
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
}) {
  const walletId = currentWalletId ?? primaryWalletId;
  const logoutButtonClassName = "rounded-full bg-primary-soft px-3 py-2 font-label text-xs text-primary-strong";
  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/wallets", label: "Wallet" },
    { href: walletId ? `/wallets/${walletId}/transactions` : "/wallets", label: "Transaksi" },
    { href: walletId ? `/wallets/${walletId}/budgets` : "/wallets", label: "Budget" },
    { href: walletId ? `/wallets/${walletId}/reports` : "/wallets", label: "Laporan" },
    { href: walletId ? `/wallets/${walletId}/members` : "/wallets", label: "Anggota" },
    { href: walletId ? `/wallets/${walletId}/settlements` : "/wallets", label: "Settlement" },
    { href: walletId ? `/wallets/${walletId}/templates` : "/wallets", label: "Template" }
  ];

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
                  currentPath === item.href ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="mb-4 rounded-xl bg-[rgba(255,255,255,0.62)] px-4 py-4 backdrop-blur md:px-6">
            <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
              <p className="text-sm text-muted-foreground">{userName}</p>
              <form action={logout}>
                <button className={logoutButtonClassName}>Keluar</button>
              </form>
            </div>
            <p className="eyebrow">{title}</p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="headline-lg">{subtitle}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Mari kita cek overview keuangan kamu dan catat agar pikiran selalu tenang dan
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-card p-2 shadow-serene">
                <div className="rounded-lg bg-muted px-3 py-2 text-center">
                  <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Wallet</p>
                  <p className="mt-1 metric text-sm">{walletCount}</p>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2 text-center">
                  <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Budget</p>
                  <p className="mt-1 metric text-sm">{budgetCount}</p>
                </div>
                <div className="rounded-lg bg-muted px-3 py-2 text-center">
                  <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Anggota</p>
                  <p className="mt-1 metric text-sm">{memberCount}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="pb-24 lg:pb-0">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-[rgba(255,255,255,0.55)] bg-[rgba(255,255,255,0.82)] p-2 shadow-float backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-3 py-3 text-center font-label text-xs transition",
                currentPath === item.href ? "bg-primary text-white" : "bg-transparent text-muted-foreground"
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
