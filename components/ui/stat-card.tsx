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
      <p className="eyebrow">{label}</p>
      <p className="metric mt-3 text-3xl">{formatCurrency(value)}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
