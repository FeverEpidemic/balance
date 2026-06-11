"use client";

import { createCategory, deleteCategory, updateCategory } from "@/app/actions/categories";
import { AppShell } from "@/components/app-shell";
import { useLocale } from "@/components/providers/locale-provider";
import { AppIcon, CategoryIcon } from "@/components/ui/app-icon";
import { ActionForm } from "@/components/ui/action-form";
import { Badge } from "@/components/ui/badge";
import { ColorPalette } from "@/components/ui/color-palette";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineEditPanel } from "@/components/ui/inline-edit-panel";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import type { CategoriesPageData } from "@/lib/data";
import { getTranslator } from "@/lib/i18n";

function kindTone(kind: CategoriesPageData["categories"][number]["kind"]) {
  return kind === "income" ? "success" : "danger";
}

function kindLabel(kind: CategoriesPageData["categories"][number]["kind"], t: ReturnType<typeof getTranslator>) {
  return kind === "income" ? t("transactions.kindIncome") : t("transactions.kindExpense");
}

function sortCategories(categories: CategoriesPageData["categories"]) {
  return [...categories].sort((left, right) => {
    if (left.is_system !== right.is_system) {
      return left.is_system ? -1 : 1;
    }

    if (left.kind !== right.kind) {
      return left.kind === "income" ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

function CategoryItem({
  category,
  canMutate,
  walletId,
  t
}: {
  category: CategoriesPageData["categories"][number];
  canMutate: boolean;
  walletId: string;
  t: ReturnType<typeof getTranslator>;
}) {
  const isEditable = canMutate && !category.is_system;

  return (
    <div className="list-card">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-card"
              style={{ borderColor: `${category.color}33`, color: category.color }}
            >
              <CategoryIcon categoryName={category.name} kind={category.kind} className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-foreground">{category.name}</p>
                <Badge tone={kindTone(category.kind)}>{kindLabel(category.kind, t)}</Badge>
                {category.is_system ? <Badge>{t("categories.systemBadge")}</Badge> : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 font-label text-[11px] uppercase tracking-[0.12em]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                  <span>{category.color}</span>
                </span>
                {!isEditable ? <span>{category.is_system ? t("categories.systemReadonly") : t("common.readOnly")}</span> : null}
              </div>
            </div>
          </div>
        </div>

        {isEditable ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-strong lg:hidden">
            <AppIcon name="edit" className="h-3.5 w-3.5" tone="primary" />
            <span>{t("categories.editButton")}</span>
          </span>
        ) : null}
      </div>

      {isEditable ? (
        <ActionForm action={updateCategory} className="mt-4">
          {({ state }) => (
            <InlineEditPanel
              buttonLabel={t("categories.editButton")}
              closeSignal={state.status === "success" ? state : null}
              description={t("categories.editDescription")}
              title={t("categories.editTitle")}
            >
              <input type="hidden" name="wallet_id" value={walletId} />
              <input type="hidden" name="category_id" value={category.id} />
              <div className="mt-3 grid min-w-0 gap-4">
                <label className="block">
                  <span className="mb-2 block font-label text-xs text-muted-foreground">{t("categories.nameLabel")}</span>
                  <input name="name" defaultValue={category.name} required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-label text-xs text-muted-foreground">{t("categories.kindLabel")}</span>
                  <select name="kind" defaultValue={category.kind}>
                    <option value="expense">{t("transactions.kindExpense")}</option>
                    <option value="income">{t("transactions.kindIncome")}</option>
                  </select>
                </label>
                <div>
                  <span className="mb-2 block font-label text-xs text-muted-foreground">{t("categories.colorLabel")}</span>
                  <ColorPalette name="color" defaultValue={category.color} />
                </div>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <SubmitButton className="w-full sm:w-auto" pendingText={t("categories.savePending")} variant="soft">
                    {t("categories.updateButton")}
                  </SubmitButton>
                </div>
              </div>
            </InlineEditPanel>
          )}
        </ActionForm>
      ) : null}

      {isEditable ? (
        <ActionForm action={deleteCategory} className="mt-2 w-full sm:w-auto">
          <input type="hidden" name="wallet_id" value={walletId} />
          <input type="hidden" name="category_id" value={category.id} />
          <ConfirmSubmitButton className="w-full sm:w-auto" confirmMessage={t("categories.deleteConfirm")} pendingText={t("categories.deletePending")} variant="ghost">
            {t("categories.deleteButton")}
          </ConfirmSubmitButton>
        </ActionForm>
      ) : null}
    </div>
  );
}

export function CategoriesPageContent({ data }: { data: CategoriesPageData }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const active = `/wallets/${data.walletId}/categories`;
  const canMutate = data.currentUserRole === "owner" || data.currentUserRole === "editor";
  const categories = sortCategories(data.categories);

  return (
    <AppShell
      currentPath={active}
      title={t("categories.pageTitle")}
      subtitle={t("categories.pageSubtitle", { walletName: data.walletName })}
      userName={data.shell.userName}
      walletCount={data.shell.walletCount}
      budgetCount={data.shell.budgetCount}
      memberCount={data.shell.memberCount}
      primaryWalletId={data.shell.primaryWalletId}
      currentWalletId={data.walletId}
    >
      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="card">
          <p className="eyebrow">{t("categories.createEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("categories.createTitle")}</h3>
          {!canMutate ? <Notice>{t("categories.viewerNotice")}</Notice> : null}
          {canMutate ? (
            <ActionForm action={createCategory} className="mt-6 grid min-w-0 gap-4" resetOnSuccess>
              <input type="hidden" name="wallet_id" value={data.walletId} />
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("categories.nameLabel")}</span>
                <input name="name" placeholder={t("categories.namePlaceholder")} required />
              </label>
              <label className="block">
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("categories.kindLabel")}</span>
                <select name="kind" defaultValue="expense">
                  <option value="expense">{t("transactions.kindExpense")}</option>
                  <option value="income">{t("transactions.kindIncome")}</option>
                </select>
              </label>
              <div>
                <span className="mb-2 block font-label text-sm text-muted-foreground">{t("categories.colorLabel")}</span>
                <ColorPalette name="color" />
              </div>
              <SubmitButton pendingText={t("categories.savePending")}>{t("categories.saveButton")}</SubmitButton>
            </ActionForm>
          ) : null}
        </div>

        <div className="card">
          <p className="eyebrow">{t("categories.listEyebrow")}</p>
          <h3 className="headline-md mt-2">{t("categories.listTitle")}</h3>
          <div className="mt-6 stack-list">
            {categories.length === 0 ? (
              <EmptyState title={t("categories.emptyTitle")} description={t("categories.emptyDescription")} />
            ) : null}
            {categories.map((category) => (
              <CategoryItem key={category.id} category={category} canMutate={canMutate} walletId={data.walletId} t={t} />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
