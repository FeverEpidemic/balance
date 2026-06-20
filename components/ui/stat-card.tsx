import { formatCurrency } from "@/lib/utils";

function getProgressColor(current: number, max: number): string {
  const ratio = current / max;
  if (ratio <= 0.5) return "var(--success)";
  if (ratio <= 0.8) return "#d4a72c";
  return "var(--danger)";
}

export function StatCard({
  label,
  value,
  detail,
  currency,
  progressValue,
  progressMax,
  progressLabel,
}: {
  label: string;
  value: number;
  detail: string;
  currency?: string;
  progressValue?: number;
  progressMax?: number;
  progressLabel?: string;
}) {
  return (
    <div className="card">
      <div className="flex min-h-full flex-col justify-between gap-4">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="metric mt-3 text-[1.3rem] leading-none sm:text-[1.7rem] md:text-3xl">{formatCurrency(value, "id", currency)}</p>

          {progressMax !== undefined && progressMax > 0 && progressValue !== undefined ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(progressValue, "id", currency)}</span>
                <span>{formatCurrency(progressMax, "id", currency)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((progressValue / progressMax) * 100, 100)}%`,
                    backgroundColor: getProgressColor(progressValue, progressMax),
                  }}
                />
              </div>
              {progressLabel ? (
                <p className="mt-1 text-xs text-muted-foreground">{progressLabel}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
