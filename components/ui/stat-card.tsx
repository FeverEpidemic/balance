import { formatCurrency } from "@/lib/utils";

export function StatCard({
  label,
  value,
  detail
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="card">
      <div className="flex min-h-full flex-col justify-between gap-4">
        <div>
          <p className="eyebrow">{label}</p>
          <p className="metric mt-3 text-[1.3rem] leading-none sm:text-[1.7rem] md:text-3xl">{formatCurrency(value)}</p>
        </div>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
