"use client";

import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";

export default function HistoryError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <AppShell
      currentPath=""
      title="Error"
      subtitle="Something went wrong"
      userName=""
      walletCount={0}
      budgetCount={0}
      memberCount={0}
      primaryWalletId=""
      currentWalletId=""
    >
      <section className="grid gap-4">
        <div className="card">
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <h3 className="headline-md">Failed to load transactions</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              An error occurred while rendering the transaction history page. This might be due to
              a data issue.
            </p>
            <div className="flex gap-2">
              <Button variant="soft" onClick={reset}>
                Try again
              </Button>
              <Button variant="ghost" href="/">
                Go home
              </Button>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
