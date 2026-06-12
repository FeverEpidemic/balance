import { notFound } from "next/navigation";
import { createSettlement } from "@/app/actions/settlements";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default async function SettlementsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; walletId: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { locale: localeParam, walletId } = await params;
  const locale = resolveLocale(localeParam);
  const t = getTranslator(locale);
  const query = await searchParams;
  const active = `/wallets/${walletId}/settlements`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  return (
    <AppShell
      currentPath={active}
      title={t("settlements.pageTitle")}
      subtitle={t("settlements.pageSubtitle", { walletName: bundle.wallet.name })}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <ToastFeedback error={query.error} message={query.message} />
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="card">
          <p className="eyebrow">{t("settlements.createEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("settlements.createTitle")}</h3>
          <form action={createSettlement} className="mt-6 grid gap-4">
            <input type="hidden" name="wallet_id" value={walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("settlements.fromLabel")}</span>
              <select name="payer_user_id" defaultValue={bundle.members[0]?.user_id ?? ""} required>
                {bundle.members.map((member) => {
                  const profile = bundle.profileMap.get(member.user_id);
                  return (
                    <option key={member.user_id} value={member.user_id}>
                      {profile?.full_name || profile?.email || member.user_id}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("settlements.toLabel")}</span>
              <select name="payee_user_id" defaultValue={bundle.members[1]?.user_id ?? bundle.members[0]?.user_id ?? ""} required>
                {bundle.members.map((member) => {
                  const profile = bundle.profileMap.get(member.user_id);
                  return (
                    <option key={member.user_id} value={member.user_id}>
                      {profile?.full_name || profile?.email || member.user_id}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("settlements.amountLabel")}</span>
              <CurrencyInput name="amount" defaultValue={325000} required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("settlements.noteLabel")}</span>
              <input name="note" placeholder={t("settlements.notePlaceholder")} />
            </label>
            <SubmitButton pendingText={t("settlements.savePending")}>{t("settlements.saveButton")}</SubmitButton>
          </form>
        </div>
        <div className="card">
          <p className="eyebrow">{t("settlements.openEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("settlements.openTitle")}</h3>
          <div className="mt-6 stack-list">
            {bundle.settlements.length === 0 ? <EmptyState title={t("settlements.emptyTitle")} description={t("settlements.emptyDescription")} /> : null}
            {bundle.settlements.map((item) => {
              const payer = bundle.profileMap.get(item.payer_user_id);
              const payee = bundle.profileMap.get(item.payee_user_id);
              return (
              <div key={item.id} className="list-card">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium">
                      {(payer?.full_name || payer?.email || t("settlements.userFallback"))} {t("settlements.toConnector")} {(payee?.full_name || payee?.email || t("settlements.userFallback"))}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.note || t("settlements.manualNote")}</p>
                  </div>
                  <p className="metric">{formatCurrency(item.amount)}</p>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
