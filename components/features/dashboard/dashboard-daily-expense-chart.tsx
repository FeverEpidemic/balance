import type { DailyExpenseItem } from "@/lib/data";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";

const CHART_HEIGHT = 192;
const MIN_BAR_HEIGHT = 6;

function getBarHeight(amount: number, maxAmount: number) {
  if (amount <= 0 || maxAmount <= 0) {
    return MIN_BAR_HEIGHT;
  }

  return Math.max((amount / maxAmount) * CHART_HEIGHT, 18);
}

function getTickIndexes(length: number) {
  if (length <= 6) {
    return Array.from({ length }, (_, index) => index);
  }

  const indexes = new Set<number>([0, length - 1]);
  const step = Math.max(Math.floor((length - 1) / 4), 1);

  for (let index = step; index < length - 1; index += step) {
    indexes.add(index);
  }

  return Array.from(indexes).sort((left, right) => left - right);
}

export function DashboardDailyExpenseChart({
  dailyExpenses,
  locale
}: {
  dailyExpenses: DailyExpenseItem[];
  locale: AppLocale;
}) {
  const t = getTranslator(locale);
  const maxAmount = Math.max(...dailyExpenses.map((item) => item.amount), 0);
  const tickIndexes = getTickIndexes(dailyExpenses.length);
  const peakExpense = dailyExpenses.reduce<DailyExpenseItem | null>((peak, item) => {
    if (!peak || item.amount > peak.amount) {
      return item;
    }

    return peak;
  }, null);
  const activeDays = dailyExpenses.filter((item) => item.amount > 0).length;

  return (
    <>
      <div className="mt-6 rounded-[1.5rem] border border-[color:var(--soft-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-container-lowest)_88%,transparent),color-mix(in_srgb,var(--surface)_94%,transparent))] p-3 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-container-lowest)_48%,transparent)] sm:p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              {t("dashboard.dailyExpenseRangeLabel", { value: `0 - ${formatCurrency(maxAmount, locale)}` })}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.dailyExpenseChartHint")}</p>
          </div>
          <div className="text-right">
            <p className="font-label text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{t("dashboard.dailyExpensePeakLabel")}</p>
            <p className="metric mt-1 text-base text-primary-strong">
              {peakExpense ? formatCurrency(peakExpense.amount, locale) : formatCurrency(0, locale)}
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-48 flex-col justify-between">
            {[0, 1, 2, 3].map((line) => (
              <div key={line} className="border-t border-dashed border-[color:color-mix(in_srgb,var(--border)_80%,transparent)]" />
            ))}
          </div>

          <div
            className="relative grid h-56 items-end gap-1 pt-3"
            style={{ gridTemplateColumns: `repeat(${dailyExpenses.length}, minmax(0, 1fr))` }}
          >
            {dailyExpenses.map((item, index) => {
              const isPeak = peakExpense?.date === item.date && item.amount > 0;
              const showLabel = tickIndexes.includes(index);

              return (
                <div key={item.date} className="flex min-w-0 flex-col items-center justify-end gap-2">
                  <div className="flex h-48 w-full items-end justify-center">
                    <div
                      aria-label={`${item.date}: ${formatCurrency(item.amount, locale)}`}
                      className={cn(
                        "w-full rounded-full transition-all",
                        item.amount > 0
                          ? "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary-soft-strong)_72%,var(--surface-container-lowest)_28%),var(--primary))]"
                          : "bg-[color:color-mix(in_srgb,var(--border)_72%,transparent)]",
                        isPeak ? "shadow-[0_10px_24px_-14px_color-mix(in_srgb,var(--primary-strong)_55%,transparent)]" : "",
                        item.isToday
                          ? "ring-2 ring-[color:color-mix(in_srgb,var(--primary)_24%,transparent)] ring-offset-2 ring-offset-[color:var(--surface-container-lowest)]"
                          : ""
                      )}
                      style={{
                        height: `${getBarHeight(item.amount, maxAmount)}px`,
                        maxWidth: "0.75rem"
                      }}
                      title={`${item.date}: ${formatCurrency(item.amount, locale)}`}
                    />
                  </div>

                  <span
                    className={cn(
                      "font-label text-[10px] leading-none text-muted-foreground",
                      showLabel ? "opacity-100" : "opacity-0",
                      item.isToday ? "text-primary-strong" : ""
                    )}
                  >
                    {item.dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="subtle-panel">
          <p className="text-sm text-muted-foreground">{t("dashboard.dailyExpensePeakLabel")}</p>
          <p className="metric mt-2 text-lg">
            {peakExpense ? formatCurrency(peakExpense.amount, locale) : formatCurrency(0, locale)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {peakExpense ? t("dashboard.dailyExpenseDayLabel", { day: peakExpense.day }) : "-"}
          </p>
        </div>
        <div className="subtle-panel">
          <p className="text-sm text-muted-foreground">{t("dashboard.dailyExpenseActiveDaysLabel")}</p>
          <p className="metric mt-2 text-lg">{t("dashboard.dailyExpenseActiveDaysValue", { count: activeDays })}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.dailyExpenseChartHint")}</p>
        </div>
      </div>
    </>
  );
}
