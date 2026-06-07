import { notFound } from "next/navigation";
import { createTemplate } from "@/app/actions/templates";
import { requireUser } from "@/lib/auth";
import { getWalletBundle } from "@/lib/data";
import { AppShell } from "@/components/app-shell";
import { CurrencyInput } from "@/components/ui/currency-input";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { ToastFeedback } from "@/components/ui/toast-feedback";
import { getTranslator, resolveLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default async function TemplatesPage({
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
  const active = `/wallets/${walletId}/templates`;
  const { user } = await requireUser();
  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    notFound();
  }

  return (
    <AppShell
      currentPath={active}
      title={t("templates.pageTitle")}
      subtitle={t("templates.pageSubtitle", { walletName: bundle.wallet.name })}
      userName={bundle.shell.userName}
      walletCount={bundle.shell.walletCount}
      budgetCount={bundle.shell.budgetCount}
      memberCount={bundle.shell.memberCount}
      primaryWalletId={bundle.shell.primaryWalletId}
      currentWalletId={walletId}
    >
      <ToastFeedback error={query.error} message={query.message} />
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="card">
          <p className="eyebrow">{t("templates.createEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("templates.createTitle")}</h3>
          <form action={createTemplate} className="mt-6 grid gap-4">
            <input type="hidden" name="wallet_id" value={walletId} />
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("templates.nameLabel")}</span>
              <input name="name" placeholder={t("templates.namePlaceholder")} required />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("templates.kindLabel")}</span>
              <select name="kind" defaultValue="expense">
                <option value="expense">{t("transactions.kindExpense")}</option>
                <option value="income">{t("transactions.kindIncome")}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("templates.categoryLabel")}</span>
              <select name="category_id" defaultValue="">
                <option value="">{t("common.noCategory")}</option>
                {bundle.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("templates.defaultAmountLabel")}</span>
              <CurrencyInput name="default_amount" defaultValue={500000} />
            </label>
            <label className="block">
              <span className="mb-2 block font-label text-sm text-muted-foreground">{t("templates.noteLabel")}</span>
              <input name="note" placeholder={t("templates.notePlaceholder")} />
            </label>
            <SubmitButton pendingText={t("templates.savePending")}>{t("templates.saveButton")}</SubmitButton>
          </form>
        </div>

        <div className="card">
          <p className="eyebrow">{t("templates.activeEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("templates.activeTitle")}</h3>
          <div className="mt-6 stack-list">
            {bundle.templates.length === 0 ? <EmptyState title={t("templates.emptyTitle")} description={t("templates.emptyDescription")} /> : null}
            {bundle.templates.map((template) => (
              <div key={template.name} className="list-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{template.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bundle.categories.find((item) => item.id === template.category_id)?.name ?? t(template.kind === "income" ? "templates.kindFallbackIncome" : "templates.kindFallbackExpense")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="metric">{formatCurrency(template.default_amount ?? 0)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
