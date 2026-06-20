"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardCategorySpend } from "@/lib/data";

export function DashboardCategoryBreakdown({
  categories,
}: {
  categories: DashboardCategorySpend[];
}) {
  const locale = useLocale();
  const t = getTranslator(locale);

  if (categories.length === 0) return null;

  return (
    <div className="card">
      <p className="eyebrow">{t("dashboard.categoryEyebrow")}</p>
      <h3 className="headline-md mt-2">{t("dashboard.categoryTitle")}</h3>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
              >
                {categories.map((cat) => (
                  <Cell key={cat.name} fill={cat.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value), locale)]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 truncate">{cat.name}</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(cat.value, locale)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
