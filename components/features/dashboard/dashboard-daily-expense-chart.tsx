import type { DailyExpenseItem } from "@/lib/data";
import { getTranslator, type AppLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

const CHART_WIDTH = 720;
const CHART_HEIGHT = 248;
const CHART_PADDING_X = 28;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_BOTTOM = 30;
const CHART_GRID_STEPS = 4;

type ChartPoint = DailyExpenseItem & {
  x: number;
  y: number;
};

function buildChartPoints(items: DailyExpenseItem[], maxAmount: number) {
  const baseline = CHART_HEIGHT - CHART_PADDING_BOTTOM;
  const usableHeight = baseline - CHART_PADDING_TOP;
  const step = items.length > 1 ? (CHART_WIDTH - CHART_PADDING_X * 2) / (items.length - 1) : 0;

  return items.map((item, index) => {
    const x = CHART_PADDING_X + step * index;
    const y = maxAmount > 0 ? baseline - (item.amount / maxAmount) * usableHeight : baseline;

    return {
      ...item,
      x,
      y
    } satisfies ChartPoint;
  });
}

function buildSmoothPath(points: ChartPoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
  }

  const lastPoint = points[points.length - 1];
  path += ` T ${lastPoint.x} ${lastPoint.y}`;

  return path;
}

function getTickIndexes(length: number) {
  if (length <= 7) {
    return Array.from({ length }, (_, index) => index);
  }

  const indexes = new Set<number>([0, length - 1]);
  const step = Math.max(Math.floor((length - 1) / 5), 1);

  for (let index = step; index < length - 1; index += step) {
    indexes.add(index);
  }

  return Array.from(indexes).sort((left, right) => left - right);
}

function getYAxisTicks(maxAmount: number) {
  return Array.from({ length: CHART_GRID_STEPS }, (_, index) => {
    const ratio = index / (CHART_GRID_STEPS - 1);
    const value = Math.round(maxAmount * (1 - ratio));
    const y = CHART_PADDING_TOP + (CHART_HEIGHT - CHART_PADDING_BOTTOM - CHART_PADDING_TOP) * ratio;

    return { ratio, value, y };
  });
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
  const chartPoints = buildChartPoints(dailyExpenses, maxAmount);
  const linePath = buildSmoothPath(chartPoints);
  const chartBaseline = CHART_HEIGHT - CHART_PADDING_BOTTOM;
  const todayPoint = chartPoints.find((item) => item.isToday) ?? null;
  const areaPath =
    chartPoints.length > 1
      ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartBaseline} L ${chartPoints[0].x} ${chartBaseline} Z`
      : "";
  const tickIndexes = getTickIndexes(dailyExpenses.length);
  const yAxisTicks = getYAxisTicks(maxAmount);
  const peakExpense = dailyExpenses.reduce<DailyExpenseItem | null>((peak, item) => {
    if (!peak || item.amount > peak.amount) {
      return item;
    }

    return peak;
  }, null);
  const activeDays = dailyExpenses.filter((item) => item.amount > 0).length;

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="theme-primary-pill inline-flex rounded-full px-3 py-1.5 font-label text-[11px] font-semibold uppercase tracking-[0.12em]">
          {t("dashboard.dailyExpensePeakLabel")}: {peakExpense ? peakExpense.dayLabel : "-"}
        </div>
        <div className="theme-primary-pill inline-flex rounded-full px-3 py-1.5 font-label text-[11px] font-semibold uppercase tracking-[0.12em]">
          {t("dashboard.dailyExpenseActiveDaysValue", { count: activeDays })}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-[42rem] rounded-[1.5rem] border border-[color:var(--soft-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(239,238,231,0.9))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] sm:p-4">
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="h-[18rem] w-full"
            role="img"
            aria-label={t("dashboard.dailyExpenseTitle")}
          >
            <defs>
              <linearGradient id="daily-expense-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {yAxisTicks.map((tick) => {
              return (
                <g key={tick.ratio}>
                  <line
                    x1={CHART_PADDING_X}
                    x2={CHART_WIDTH - CHART_PADDING_X}
                    y1={tick.y}
                    y2={tick.y}
                    stroke="var(--border)"
                    strokeDasharray="4 8"
                    strokeWidth="1"
                  />
                  <text
                    x={8}
                    y={tick.y + 4}
                    fill="var(--muted-foreground)"
                    fontSize="11"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatCurrency(tick.value, locale)}
                  </text>
                </g>
              );
            })}

            {todayPoint ? (
              <rect
                x={todayPoint.x - 8}
                y={CHART_PADDING_TOP}
                width="16"
                height={chartBaseline - CHART_PADDING_TOP}
                fill="var(--primary)"
                fillOpacity="0.05"
                rx="8"
              />
            ) : null}

            {areaPath ? <path d={areaPath} fill="url(#daily-expense-fill)" /> : null}
            {linePath ? <path d={linePath} fill="none" stroke="var(--primary)" strokeLinecap="round" strokeWidth="3" /> : null}

            {chartPoints.map((item) => {
              const isPeak = peakExpense?.date === item.date && item.amount > 0;
              const isHighlighted = item.isToday || isPeak;

              if (!isHighlighted) {
                return null;
              }

              return (
                <g key={item.date}>
                  <circle cx={item.x} cy={item.y} r="7" fill="var(--card)" stroke="var(--primary)" strokeOpacity="0.22" strokeWidth="5" />
                  <circle cx={item.x} cy={item.y} r="3.5" fill={isPeak ? "var(--primary-strong)" : "var(--primary)"} />
                </g>
              );
            })}

            {tickIndexes.map((index) => {
              const item = chartPoints[index];

              return (
                <g key={item.date}>
                  <line x1={item.x} x2={item.x} y1={chartBaseline} y2={chartBaseline + 6} stroke="var(--outline-variant)" strokeWidth="1" />
                  <text
                    x={item.x}
                    y={CHART_HEIGHT - 8}
                    fill={item.isToday ? "var(--primary-strong)" : "var(--muted-foreground)"}
                    fontSize="11"
                    textAnchor="middle"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {item.dayLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p>{t("dashboard.dailyExpenseRangeLabel", { value: `0 - ${formatCurrency(maxAmount, locale)}` })}</p>
            <p className="sm:text-right">
              {todayPoint
                ? t("dashboard.dailyExpenseTodayLabel", {
                    day: todayPoint.dayLabel,
                    amount: formatCurrency(todayPoint.amount, locale)
                  })
                : peakExpense
                  ? `${peakExpense.dayLabel}: ${formatCurrency(peakExpense.amount, locale)}`
                  : formatCurrency(0, locale)}
            </p>
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
