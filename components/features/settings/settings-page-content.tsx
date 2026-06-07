"use client";

import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { updateLocalePreference, updateThemePreference } from "@/app/actions/theme";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { createApiKey, revokeApiKey, deleteApiKey } from "@/app/actions/api-keys";
import { initialActionResult } from "@/app/actions/action-result";
import type { SettingsData } from "@/lib/data/types";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { cn, formatDateTime } from "@/lib/utils";

export function SettingsPageContent({ settings, locale }: { settings: SettingsData; locale: AppLocale }) {
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
  const prevCreateStatusRef = useRef<"idle" | "success" | "error">("idle");
  const t = getTranslator(locale);
  const themeOptions = [
    {
      value: "system",
      label: t("settings.themeSystemLabel"),
      description: t("settings.themeSystemDescription")
    },
    {
      value: "light",
      label: t("settings.themeLightLabel"),
      description: t("settings.themeLightDescription")
    },
    {
      value: "dark",
      label: t("settings.themeDarkLabel"),
      description: t("settings.themeDarkDescription")
    }
  ] as const;
  const languageOptions = [
    {
      value: "id",
      label: t("settings.languageIdLabel"),
      description: t("settings.languageIdDescription")
    },
    {
      value: "en",
      label: t("settings.languageEnLabel"),
      description: t("settings.languageEnDescription")
    }
  ] as const;

  return (
    <AppShell
      currentPath="/settings"
      title={t("settings.title")}
      subtitle={t("settings.subtitle")}
      userName={settings.shell.userName}
      walletCount={settings.shell.walletCount}
      budgetCount={settings.shell.budgetCount}
      memberCount={settings.shell.memberCount}
      primaryWalletId={settings.shell.primaryWalletId}
    >
      <div className="space-y-6">
        <section className="card">
          <h3 className="headline-sm">{t("settings.themeTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.themeDescription")}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {themeOptions.map((option) => {
              const isActive = settings.themePreference === option.value;

              return (
                <ActionForm
                  key={option.value}
                  action={updateThemePreference}
                  initialState={initialActionResult}
                >
                  {({ pending }) => (
                    <>
                      <input type="hidden" name="theme_preference" value={option.value} />
                      <button
                        type="submit"
                        disabled={pending}
                        className={cn(
                          "flex h-full w-full flex-col items-start rounded-[1.25rem] border p-4 text-left transition",
                          isActive
                            ? "border-primary bg-primary-soft text-foreground shadow-serene"
                            : "border-border bg-overlay text-foreground hover:border-primary/35 hover:bg-card"
                        )}
                      >
                        <span className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {isActive ? t("common.active") : t("common.theme")}
                        </span>
                        <span className="mt-3 headline-md">{option.label}</span>
                        <span className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</span>
                      </button>
                    </>
                  )}
                </ActionForm>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h3 className="headline-sm">{t("settings.languageTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.languageDescription")}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {languageOptions.map((option) => {
              const isActive = settings.preferredLocale === option.value;

              return (
                <ActionForm key={option.value} action={updateLocalePreference} initialState={initialActionResult}>
                  {({ pending }) => (
                    <>
                      <input type="hidden" name="preferred_locale" value={option.value} />
                      <button
                        type="submit"
                        disabled={pending}
                        className={cn(
                          "flex h-full w-full flex-col items-start rounded-[1.25rem] border p-4 text-left transition",
                          isActive
                            ? "border-primary bg-primary-soft text-foreground shadow-serene"
                            : "border-border bg-overlay text-foreground hover:border-primary/35 hover:bg-card"
                        )}
                      >
                        <span className="font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {isActive ? t("common.active") : t("common.language")}
                        </span>
                        <span className="mt-3 headline-md">{option.label}</span>
                        <span className="mt-2 text-sm leading-6 text-muted-foreground">{option.description}</span>
                      </button>
                    </>
                  )}
                </ActionForm>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h3 className="headline-sm">{t("settings.apiCreateTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.apiCreateDescription")}</p>

          <ActionForm
            action={createApiKey}
            className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end"
            initialState={initialActionResult}
            resetOnSuccess
          >
            {({ state }) => {
              if (state.status === "success" && state.message && prevCreateStatusRef.current !== "success") {
                prevCreateStatusRef.current = "success";
                if (state.message.length > 20) {
                  setNewKeyResult(state.message);
                }
              }

              if (state.status === "idle") {
                prevCreateStatusRef.current = "idle";
              }

              return (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="font-label text-xs text-muted-foreground uppercase tracking-[0.12em]">{t("settings.apiNameLabel")}</span>
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder={t("settings.apiNamePlaceholder")}
                      className="mt-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-2.5 font-label text-xs font-semibold uppercase tracking-[0.12em] text-[var(--button-primary-text)] transition hover:bg-primary-hover"
                  >
                    {t("settings.apiCreateButton")}
                  </button>
                </>
              );
            }}
          </ActionForm>

          {newKeyResult ? (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary-soft p-4">
              <p className="font-label text-xs font-semibold uppercase tracking-[0.12em] text-primary-strong">{t("settings.apiNewKeyTitle")}</p>
              <p className="mt-2 break-all font-mono text-sm text-foreground">{newKeyResult}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("settings.apiNewKeyDescription")}</p>
              <button
                type="button"
                className="mt-3 rounded-full bg-card px-4 py-1.5 font-label text-xs font-semibold text-primary-strong transition hover:bg-overlay"
                onClick={() => setNewKeyResult(null)}
              >
                {t("settings.apiNewKeyDismiss")}
              </button>
            </div>
          ) : null}
        </section>

        <section className="card">
          <h3 className="headline-sm">{t("settings.apiListTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.apiListDescription")}</p>

          {settings.apiKeys.length === 0 ? (
            <div className="mt-6 text-center text-sm text-muted-foreground">{t("settings.apiEmpty")}</div>
          ) : (
            <div className="mt-6 space-y-3">
              {settings.apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{key.name}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{key.keyPrefix}…</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("common.created", {
                        date: formatDateTime(key.createdAt, locale, { day: "numeric", month: "short", year: "numeric" })
                      })}
                      {key.lastUsedAt
                        ? ` — ${t("common.lastUsed", {
                            date: formatDateTime(key.lastUsedAt, locale, { day: "numeric", month: "short", year: "numeric" })
                          })}`
                        : ""}
                    </p>
                    {key.isRevoked ? (
                      <p className="theme-danger-pill mt-2 inline-flex rounded-full px-2.5 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]">{t("settings.apiRevoked")}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {!key.isRevoked ? (
                      <ActionForm
                        action={revokeApiKey}
                        className="contents"
                        initialState={initialActionResult}
                      >
                        <input type="hidden" name="key_id" value={key.id} />
                        <button
                          type="submit"
                          className="theme-danger-pill rounded-full px-4 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition hover:opacity-90"
                        >
                          {t("settings.apiRevoke")}
                        </button>
                      </ActionForm>
                    ) : (
                      <ActionForm
                        action={deleteApiKey}
                        className="contents"
                        initialState={initialActionResult}
                      >
                        <input type="hidden" name="key_id" value={key.id} />
                        <ConfirmSubmitButton
                          confirmMessage={t("settings.apiDeleteConfirm")}
                          className="rounded-full border border-border bg-card px-4 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground transition hover:border-[var(--danger-border)] hover:text-danger"
                        >
                          {t("common.delete")}
                        </ConfirmSubmitButton>
                      </ActionForm>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
