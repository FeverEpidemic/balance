import type { DailyExpenseItem } from "@/lib/data";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { cn, formatCurrency } from "@/lib/utils";

function getBarHeight(amount: number, maxAmount: number) {
  if (amount <= 0 || maxAmount <= 0) {
    return 4;
  }

  return Math.max((amount / maxAmount) * 192, 16);
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
  const peakExpense = dailyExpenses.reduce<DailyExpenseItem | null>((peak, item) => {
    if (!peak || item.amount > peak.amount) {
      return item;
    }

    return peak;
  }, null);
  const activeDays = dailyExpenses.filter((item) => item.amount > 0).length;

  return (
    <>
      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-max rounded-[1.5rem] bg-muted/35 p-3 sm:p-4">
          <div className="flex min-h-[16rem] items-end gap-2 sm:gap-2.5">
            {dailyExpenses.map((item, index) => {
              const showMobileLabel =
                index === 0 || index === dailyExpenses.length - 1 || item.isToday || (index + 1) % 5 === 0;
              const showDesktopLabel = showMobileLabel || (index + 1) % 3 === 0;

              return (
                <div key={item.date} className="flex w-4 shrink-0 flex-col items-center justify-end gap-2 sm:w-5">
                  <div className="flex h-52 items-end">
                    <div
                      aria-label={`${item.date}: ${formatCurrency(item.amount, locale)}`}
                      className={cn(
                        "w-4 rounded-full transition-all sm:w-5",
                        item.amount > 0 ? "bg-primary shadow-serene" : "bg-border/70",
                        item.isToday ? "ring-2 ring-primary/25 ring-offset-2 ring-offset-muted/35" : ""
                      )}
                      style={{ height: `${getBarHeight(item.amount, maxAmount)}px` }}
                      title={`${item.date}: ${formatCurrency(item.amount, locale)}`}
                    />
                  </div>
                  <span
                    className={cn(
                      "font-label text-[10px] text-muted-foreground",
                      showMobileLabel ? "block" : "hidden",
                      showDesktopLabel ? "sm:block" : "sm:hidden"
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
