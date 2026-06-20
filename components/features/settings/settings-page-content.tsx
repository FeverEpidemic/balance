"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { updateLocalePreference, updateThemePreference, updateTimezonePreference, updateDefaultCurrency } from "@/app/actions/theme";
import { disableAiChat } from "@/app/actions/ai-compliance";
import { AiChatConsentDialog } from "@/components/features/chat/ai-chat-consent-dialog";
import { ActionForm } from "@/components/ui/action-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { createApiKey, revokeApiKey, deleteApiKey } from "@/app/actions/api-keys";
import { initialActionResult } from "@/app/actions/action-result";
import type { SettingsData } from "@/lib/data/types";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { cn, formatDateTime } from "@/lib/utils";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { MidtransSnapPopup } from "@/components/features/settings/midtrans-snap-popup";
import { savePushSubscriptionAction, deletePushSubscriptionAction, updateReminderPreferencesAction } from "@/app/actions/reminders";
import { registerPushSubscription, unsubscribePushNotification } from "@/lib/push-helper";
import { toast } from "sonner";

export function SettingsPageContent({ settings, locale }: { settings: SettingsData; locale: AppLocale }) {
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);
  const prevCreateStatusRef = useRef<"idle" | "success" | "error">("idle");
  const t = getTranslator(locale);
  const [isReminderEnabled, setIsReminderEnabled] = useState(settings.dailyReminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.dailyReminderTime);
  const [isReminderSubmitting, setIsReminderSubmitting] = useState(false);

  const handleReminderToggle = async (checked: boolean) => {
    setIsReminderSubmitting(true);
    try {
      if (checked) {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          toast.error(t("settings.reminderUnsupported"));
          setIsReminderSubmitting(false);
          return;
        }

        const subscription = await registerPushSubscription(vapidKey);
        
        const saveResult = await savePushSubscriptionAction(
          subscription.endpoint,
          subscription.p256dh,
          subscription.auth
        );

        if (saveResult.status === "error") {
          throw new Error(saveResult.message || "Failed to save subscription");
        }

        const updateResult = await updateReminderPreferencesAction(true, reminderTime);
        if (updateResult.status === "error") {
          throw new Error(updateResult.message || "Failed to update reminder preferences");
        }

        setIsReminderEnabled(true);
        toast.success(t("settings.reminderSuccessEnabled"));
      } else {
        const endpoint = await unsubscribePushNotification();
        if (endpoint) {
          await deletePushSubscriptionAction(endpoint);
        }

        const updateResult = await updateReminderPreferencesAction(false, reminderTime);
        if (updateResult.status === "error") {
          throw new Error(updateResult.message || "Failed to disable reminder preferences");
        }

        setIsReminderEnabled(false);
        toast.success(t("settings.reminderSuccessDisabled"));
      }
    } catch (error: any) {
      console.error("[reminders-ui] Error toggling reminder:", error);
      const message = error.message || t("actionErrors.unexpectedError");
      if (message.includes("permission denied") || message.includes("Denied")) {
        toast.error(t("settings.reminderPermissionDenied"));
      } else {
        toast.error(message);
      }
    } finally {
      setIsReminderSubmitting(false);
    }
  };

  const handleReminderTimeChange = async (newTime: string) => {
    setReminderTime(newTime);
    if (!isReminderEnabled) return;

    setIsReminderSubmitting(true);
    try {
      const updateResult = await updateReminderPreferencesAction(true, newTime);
      if (updateResult.status === "error") {
        throw new Error(updateResult.message || "Failed to update reminder preferences");
      }
      toast.success(t("settings.reminderSuccessEnabled") + ` (${newTime})`);
    } catch (error: any) {
      console.error("[reminders-ui] Error changing reminder time:", error);
      toast.error(error.message || t("actionErrors.unexpectedError"));
    } finally {
      setIsReminderSubmitting(false);
    }
  };
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
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="headline-sm">{t("settings.aiChatTitle")}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t("settings.aiChatDescription")}</p>
            </div>
            <span
              className={cn(
                "inline-flex w-fit rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]",
                settings.aiChatEnabled && !settings.aiChatConsentRequired
                  ? "bg-primary-soft text-primary-strong"
                  : settings.aiChatConsentRequired
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {settings.aiChatEnabled && !settings.aiChatConsentRequired
                ? t("settings.aiChatStatusEnabled")
                : settings.aiChatConsentRequired
                  ? t("settings.aiChatStatusNeedsConsent")
                  : t("settings.aiChatStatusDisabled")}
            </span>
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-border bg-muted/50 p-4">
            <p className="text-sm text-foreground">{t("settings.aiChatDisclosureSummary")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("settings.aiChatDisclosureDetail")}</p>
            <Link href={`/${locale}/privacy`} className="mt-3 inline-flex text-sm font-medium text-primary hover:text-primary-strong">
              {t("settings.aiChatPrivacyLink")}
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {settings.aiChatEnabled ? (
              <ActionForm action={disableAiChat} initialState={initialActionResult}>
                {({ pending }) => (
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-full border border-border px-5 py-2.5 font-label text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition hover:bg-muted disabled:opacity-50"
                  >
                    {t("settings.aiChatDisable")}
                  </button>
                )}
              </ActionForm>
            ) : null}

            {(!settings.aiChatEnabled || settings.aiChatConsentRequired) ? (
              <AiChatConsentDialog
                locale={locale}
                triggerLabel={settings.aiChatConsentRequired ? t("settings.aiChatReviewConsent") : t("settings.aiChatEnable")}
                triggerVariant="primary"
                triggerClassName="rounded-full px-5 py-2.5 text-xs uppercase tracking-[0.12em]"
              />
            ) : null}
          </div>

          <p className="mt-3 text-xs text-muted-foreground">{t("settings.aiChatFootnote")}</p>
        </section>

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
          <h3 className="headline-sm">{t("settings.timezoneTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.timezoneDescription")}</p>
          <ActionForm action={updateTimezonePreference} className="mt-4">
            {({ pending }) => (
              <>
                <select
                  name="timezone"
                  defaultValue={settings.timezone ?? "auto"}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground"
                  disabled={pending}
                >
                  <option value="auto">{t("settings.timezoneAutoLabel")}</option>
                  <option value="Asia/Jakarta">WIB — Asia/Jakarta (UTC+7)</option>
                  <option value="Asia/Makassar">WITA — Asia/Makassar (UTC+8)</option>
                  <option value="Asia/Jayapura">WIT — Asia/Jayapura (UTC+9)</option>
                  <option disabled>──────────</option>
                  <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                  <option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur (UTC+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  <option value="Asia/Seoul">Asia/Seoul (UTC+9)</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                  <option value="Asia/Taipei">Asia/Taipei (UTC+8)</option>
                  <option value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</option>
                  <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                  <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                  <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                  <option value="Europe/Amsterdam">Europe/Amsterdam (UTC+1/+2)</option>
                  <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                  <option value="America/Chicago">America/Chicago (UTC-6/-5)</option>
                  <option value="America/Denver">America/Denver (UTC-7/-6)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (UTC-8/-7)</option>
                  <option value="Australia/Sydney">Australia/Sydney (UTC+10/+11)</option>
                  <option value="Pacific/Auckland">Pacific/Auckland (UTC+12/+13)</option>
                </select>
                <button
                  type="submit"
                  disabled={pending}
                  className="mt-3 rounded-full bg-primary px-6 py-2.5 font-label text-xs font-semibold uppercase tracking-[0.12em] text-[var(--button-primary-text)] transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {pending ? t("transactions.savePending") : t("common.save")}
                </button>
              </>
            )}
          </ActionForm>
        </section>

        <section className="card">
          <h3 className="headline-sm">{t("settings.reminderTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.reminderDescription")}</p>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-overlay p-4">
              <div className="space-y-0.5">
                <label htmlFor="reminder-toggle" className="text-sm font-medium text-foreground">
                  {t("settings.reminderEnabledLabel")}
                </label>
              </div>
              <button
                type="button"
                id="reminder-toggle"
                disabled={isReminderSubmitting}
                onClick={() => handleReminderToggle(!isReminderEnabled)}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50",
                  isReminderEnabled ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow-sm ring-0 transition duration-200 ease-in-out",
                    isReminderEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {isReminderEnabled && (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-overlay p-4 transition-all duration-200">
                <label htmlFor="reminder-time" className="text-sm font-medium text-foreground">
                  {t("settings.reminderTimeLabel")}
                </label>
                <input
                  type="time"
                  id="reminder-time"
                  value={reminderTime}
                  disabled={isReminderSubmitting}
                  onChange={(e) => handleReminderTimeChange(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <h3 className="headline-sm">{t("settings.currencyTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.currencyDescription")}</p>
          <ActionForm action={updateDefaultCurrency} className="mt-4">
            {({ pending }) => (
              <>
                <select
                  name="default_currency"
                  defaultValue={settings.defaultCurrency}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground"
                  disabled={pending}
                >
                  <option value="IDR">IDR — Indonesian Rupiah</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="SGD">SGD — Singapore Dollar</option>
                  <option value="MYR">MYR — Malaysian Ringgit</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="JPY">JPY — Japanese Yen</option>
                  <option value="AUD">AUD — Australian Dollar</option>
                  <option value="CNY">CNY — Chinese Yuan</option>
                  <option value="SAR">SAR — Saudi Riyal</option>
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="PHP">PHP — Philippine Peso</option>
                  <option value="THB">THB — Thai Baht</option>
                  <option value="KRW">KRW — South Korean Won</option>
                  <option value="BND">BND — Brunei Dollar</option>
                </select>
                <button
                  type="submit"
                  disabled={pending}
                  className="mt-3 rounded-full bg-primary px-6 py-2.5 font-label text-xs font-semibold uppercase tracking-[0.12em] text-[var(--button-primary-text)] transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {pending ? t("transactions.savePending") : t("common.save")}
                </button>
              </>
            )}
          </ActionForm>
        </section>

        {/* ── Plan card ─────────────────────────────── */}
        <section className="card">
          <h3 className="headline-sm">{t("settings.planTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.planDescription")}</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-label text-xs text-muted-foreground uppercase tracking-[0.12em]">
                {t("settings.planStatusLabel")}
              </span>
              {settings.trialMeta.isTrialActive ? (
                <>
                  <span
                    className="inline-flex rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ backgroundColor: "var(--color-accent-soft, #dbe4d8)", color: "var(--color-accent-strong, #3d5a3d)" }}
                  >
                    {t("settings.planStatusTrial")}
                  </span>
                  {settings.trialMeta.trialDaysRemaining !== null && (
                    <span className="font-label text-[11px] text-muted-foreground">
                      {settings.trialMeta.trialDaysRemaining >= 1
                        ? t("settings.planTrialDaysRemaining", {
                            days: Math.round(settings.trialMeta.trialDaysRemaining)
                          })
                        : t("settings.planTrialHoursRemaining", {
                            hours: Math.max(1, Math.ceil(settings.trialMeta.trialDaysRemaining * 24))
                          })}
                    </span>
                  )}
                </>
              ) : (
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em]",
                    settings.planType === "premium"
                      ? "bg-primary-soft text-primary-strong"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {settings.planType === "premium"
                    ? t("settings.planStatusPremium")
                    : t("settings.planStatusFree")}
                </span>
              )}
            </div>
            <ul className="space-y-2 text-sm text-foreground">
              {settings.planType === "free" && settings.aiChatDailyLimit !== null ? (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                  <span>
                    {t("settings.planBenefitAiChatFree", {
                      limit: settings.aiChatDailyLimit
                    })}
                  </span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                  <span>{t("settings.planBenefitAiChatPremium")}</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                <span>{t("settings.planBenefitTransactionUnlimited")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                <span>{t("settings.planBenefitApiAlways")}</span>
              </li>
              {settings.planType === "free" ? (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                  <span>{t("settings.planBenefitReportHistoryFree")}</span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                  <span>{t("settings.planBenefitReportHistoryPremium")}</span>
                </li>
              )}
              {settings.planType === "free" ? (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                  <span>{t("settings.planBenefitExportFree")}</span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-muted-foreground">•</span>
                  <span>{t("settings.planBenefitExportPremium")}</span>
                </li>
              )}
            </ul>
            {!settings.trialMeta.isTrialActive && settings.planType === "free" && settings.trialMeta.trialEndsAt ? (
              <p className="mt-3 text-xs text-muted-foreground">{t("settings.planTrialExpiredNote")}</p>
            ) : null}
            {settings.planType === "free" ? (
              <div className="mt-4">
                {upgradeMessage && (
                  <p className="mb-3 text-xs text-success">{upgradeMessage}</p>
                )}
                <button
                  onClick={() => setUpgradeOpen(true)}
                  className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 font-label text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                >
                  {t("settings.planUpgradeCta")}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <InstallPrompt />

        <MidtransSnapPopup
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          onComplete={({ success, message }) => {
            if (success && message) {
              setUpgradeMessage(message);
            }
          }}
        />

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
