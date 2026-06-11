"use client";

import { useState } from "react";
import { createWallet } from "@/app/actions/wallets";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { getTranslator, type AppLocale } from "@/lib/i18n";

export function DashboardWalletCreate({
  walletCount,
  locale,
}: {
  walletCount: number;
  locale: AppLocale;
}) {
  const t = getTranslator(locale);
  const [showForm, setShowForm] = useState(walletCount === 0);

  if (!showForm) {
    return (
      <section className="mb-4">
        <Button
          type="button"
          variant="soft"
          onClick={() => setShowForm(true)}
          className="w-full rounded-2xl min-h-[3rem]"
        >
          {t("wallets.createButton")}
        </Button>
      </section>
    );
  }

  return (
    <section className="glass-panel mb-4 grid gap-4 rounded-2xl p-4 xl:grid-cols-[1fr_360px]">
      <div>
        <p className="headline-md">{t("wallets.heroTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("wallets.heroDescription")}</p>
      </div>
      <form action={createWallet} className="grid gap-3 rounded-2xl bg-muted p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("wallets.nameLabel")}</span>
            <input name="name" placeholder={t("wallets.namePlaceholder")} required />
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("wallets.kindLabel")}</span>
            <select name="kind" defaultValue="personal">
              <option value="personal">{t("wallets.kindPersonal")}</option>
              <option value="shared">{t("wallets.kindShared")}</option>
            </select>
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("wallets.setupPresetLabel")}</span>
            <select name="setup_preset" defaultValue="standard">
              <option value="minimal">{t("wallets.setupMinimal")}</option>
              <option value="standard">{t("wallets.setupStandard")}</option>
              <option value="family">{t("wallets.setupFamily")}</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block font-label text-sm text-muted-foreground">{t("wallets.budgetPresetLabel")}</span>
            <select name="budget_preset" defaultValue="balanced">
              <option value="none">{t("wallets.budgetPresetNone")}</option>
              <option value="light">{t("wallets.budgetPresetLight")}</option>
              <option value="balanced">{t("wallets.budgetPresetBalanced")}</option>
              <option value="ambitious">{t("wallets.budgetPresetAmbitious")}</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("wallets.presetDescription")}
        </p>
        <SubmitButton pendingText={t("wallets.createPending")}>{t("wallets.createButton")}</SubmitButton>
      </form>
      {walletCount > 0 && (
        <div className="xl:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="rounded-full px-3 py-2 font-label text-xs text-muted-foreground transition hover:bg-muted"
          >
            {t("common.cancel")}
          </button>
        </div>
      )}
    </section>
  );
}
