import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { slug: "", label: "Ringkasan" },
  { slug: "/transactions", label: "Transaksi" },
  { slug: "/savings", label: "Tabungan" },
  { slug: "/recurring", label: "Otomatis" },
  { slug: "/budgets", label: "Anggaran" },
  { slug: "/reports", label: "Laporan" },
  { slug: "/members", label: "Anggota" },
  { slug: "/settlements", label: "Pelunasan" },
  { slug: "/templates", label: "Template" }
];

export function WalletTabs({ walletId, active }: { walletId: string; active: string }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <div className="glass-panel inline-flex min-w-full gap-2 rounded-2xl p-2">
        {tabs.map((tab) => {
          const href = `/wallets/${walletId}${tab.slug}`;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-xl px-3 py-2 font-label text-xs font-semibold uppercase tracking-[0.12em] transition sm:px-4 sm:py-3 sm:text-sm sm:normal-case sm:tracking-[0.02em]",
                active === href ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
