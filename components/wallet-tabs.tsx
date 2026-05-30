import Link from "next/link";
import { cn } from "@/lib/utils";

const tabs = [
  { slug: "", label: "Ringkasan" },
  { slug: "/transactions", label: "Transaksi" },
  { slug: "/savings", label: "Saving" },
  { slug: "/recurring", label: "Recurring" },
  { slug: "/budgets", label: "Budget" },
  { slug: "/reports", label: "Laporan" },
  { slug: "/members", label: "Anggota" },
  { slug: "/settlements", label: "Settlement" },
  { slug: "/templates", label: "Template" }
];

export function WalletTabs({ walletId, active }: { walletId: string; active: string }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <div className="inline-flex min-w-full gap-2 rounded-2xl bg-[rgba(255,255,255,0.7)] p-2 shadow-serene">
        {tabs.map((tab) => {
          const href = `/wallets/${walletId}${tab.slug}`;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-3 font-label text-sm transition",
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
