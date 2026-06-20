import { notFound } from "next/navigation";
import { createDebt, deleteDebt, recordDebtPayment } from "@/app/actions/debts";
import { requireUser } from "@/lib/auth";
import { getDebtsPageData } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { ActionForm } from "@/components/ui/action-form";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import type {
  DebtDirection,
  DebtsPageData,
  DebtStatus
} from "@/lib/data/types";

function debtStatusBadge(status: DebtStatus, t: ReturnType<typeof getTranslator>) {
  const colors: Record<DebtStatus, string> = {
    unpaid: "bg-warning/20 text-warning",
    partially_paid: "bg-info/20 text-info",
    settled: "bg-success/20 text-success",
    cancelled: "bg-muted text-muted-foreground"
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-label ${colors[status]}`}>
      {t(`debts.status${status.charAt(0).toUpperCase() + status.slice(1)}`)}
    </span>
  );
}

export default async function DebtsPage({
  params
}: {
  params: Promise<{ locale: string; walletId: string }>;
}) {
  const { locale: localeParam, walletId } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  const active = `/wallets/${walletId}/debts`;
  const { user } = await requireUser();
  const data = await getDebtsPageData(user.id, walletId);

  if (!data) {
    notFound();
  }

  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";

  // Compute summary
  const borrowedUnpaid = data.debts
    .filter((d) => d.direction === "borrowed" && d.status !== "settled" && d.status !== "cancelled")
    .reduce((sum, d) => sum + d.amount, 0);
  const lentUnpaid = data.debts
    .filter((d) => d.direction === "lent" && d.status !== "settled" && d.status !== "cancelled")
    .reduce((sum, d) => sum + d.amount, 0);
  const paidAmounts = new Map<string, number>();
  for (const p of data.payments) {
    paidAmounts.set(p.debt_id, (paidAmounts.get(p.debt_id) ?? 0) + p.amount);
  }

  const openDebts = data.debts.filter((d) => d.status !== "settled" && d.status !== "cancelled");
  const closedDebts = data.debts.filter((d) => d.status === "settled" || d.status === "cancelled");

  return (
    <AppShell
      currentPath={active}
      title={t("debts.pageTitle")}
      subtitle={t("debts.pageSubtitle", { walletName: data.walletName })}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      {/* Summary Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="eyebrow">{t("debts.borrowedLabel")}</p>
          <p className={`metric mt-2 text-2xl ${borrowedUnpaid > 0 ? "text-danger" : ""}`}>
            {formatCurrency(borrowedUnpaid)}
          </p>
        </div>
        <div className="card">
          <p className="eyebrow">{t("debts.lentLabel")}</p>
          <p className={`metric mt-2 text-2xl ${lentUnpaid > 0 ? "text-success" : ""}`}>
            {formatCurrency(lentUnpaid)}
          </p>
        </div>
        <div className="card">
          <p className="eyebrow">{t("debts.netLabel")}</p>
          <p className={`metric mt-2 text-2xl ${lentUnpaid - borrowedUnpaid !== 0 ? "text-primary" : ""}`}>
            {formatCurrency(lentUnpaid - borrowedUnpaid)}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        {/* Create Debt Form */}
        <div className="card self-start">
          <p className="eyebrow">{t("debts.createEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("debts.createTitle")}</h3>
          {canMutate ? (
            <ActionForm action={createDebt} className="mt-6 grid min-w-0 gap-4" resetOnSuccess>
              <input type="hidden" name="wallet_id" value={walletId} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("debts.directionLabel")}</span>
                <select name="direction" required>
                  <option value="borrowed">{t("debts.directionBorrowed")}</option>
                  <option value="lent">{t("debts.directionLent")}</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("debts.personNameLabel")}</span>
                <input name="person_name" placeholder={t("debts.personNamePlaceholder")} required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("debts.amountLabel")}</span>
                <CurrencyInput name="amount" placeholder="0" required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("debts.noteLabel")}</span>
                <input name="note" placeholder={t("debts.notePlaceholder")} />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("debts.dueDateLabel")}</span>
                <input name="due_date" type="date" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="sync_with_wallet" type="checkbox" value="true" className="h-4 w-4 rounded border-muted-foreground" defaultChecked />
                <span className="text-muted-foreground">{t("debts.syncWithWalletLabel")}</span>
              </label>
              <SubmitButton pendingText={t("debts.savePending")}>{t("debts.saveButton")}</SubmitButton>
            </ActionForm>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">{t("debts.viewerNotice")}</p>
          )}
        </div>

        {/* Open Debts List */}
        <div>
          <div className="card">
            <p className="eyebrow">{t("debts.openEyebrow")}</p>
            <h3 className="headline-md mt-2">{t("debts.openTitle")}</h3>
            <div className="mt-6 stack-list">
              {openDebts.length === 0 ? (
                <EmptyState title={t("debts.emptyTitle")} description={t("debts.emptyDescription")} />
              ) : null}
              {openDebts.map((debt) => {
                const paid = paidAmounts.get(debt.id) ?? 0;
                const remaining = debt.amount - paid;
                return (
                  <div key={debt.id} className="list-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{debt.person_name}</span>
                          {debtStatusBadge(debt.status, t)}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {debt.direction === "borrowed" ? t("debts.youOwe") : t("debts.owedToYou")}
                          {debt.note ? ` · ${debt.note}` : ""}
                          {debt.due_date ? ` · ${t("debts.dueLabel")} ${debt.due_date}` : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="metric">{formatCurrency(remaining)}</p>
                        {paid > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {t("debts.paidLabel")} {formatCurrency(paid)}
                          </p>
                        )}
                      </div>
                    </div>
                    {canMutate && debt.status !== "settled" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <ActionForm action={recordDebtPayment} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="debt_id" value={debt.id} />
                          <input type="hidden" name="wallet_id" value={walletId} />
                          <input type="hidden" name="sync_with_wallet" value="true" />
                          <CurrencyInput name="amount" placeholder={formatCurrency(remaining)} className="w-28" />
                          <SubmitButton pendingText="..." variant="soft">
                            {t("debts.payButton")}
                          </SubmitButton>
                        </ActionForm>
                        <ActionForm action={deleteDebt}>
                          <input type="hidden" name="debt_id" value={debt.id} />
                          <input type="hidden" name="wallet_id" value={walletId} />
                          <ConfirmSubmitButton confirmMessage={t("debts.deleteConfirm")} pendingText="..." variant="ghost">
                            {t("debts.deleteButton")}
                          </ConfirmSubmitButton>
                        </ActionForm>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settled Debts */}
          {closedDebts.length > 0 && (
            <div className="card mt-4">
              <p className="eyebrow">{t("debts.settledEyebrow")}</p>
              <h3 className="headline-md mt-2">{t("debts.settledTitle")}</h3>
              <div className="mt-4 stack-list">
                {closedDebts.map((debt) => (
                  <div key={debt.id} className="list-card opacity-70">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="font-medium">{debt.person_name}</span>
                        <span className="ml-2">{debtStatusBadge(debt.status, t)}</span>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {debt.direction === "borrowed" ? t("debts.youOwe") : t("debts.owedToYou")}
                          {debt.note ? ` · ${debt.note}` : ""}
                        </p>
                      </div>
                      <p className="metric text-sm">{formatCurrency(debt.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
