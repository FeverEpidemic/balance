"use client";

import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils";

type CategoryOption = {
  id: string;
  name: string;
  kind: "income" | "expense";
};

export function CategorySelect({
  categories,
  className,
  defaultValue,
  emptyLabel,
  includeEmptyOption = false,
  name,
  required
}: {
  categories: CategoryOption[];
  className?: string;
  defaultValue?: string;
  emptyLabel?: string;
  includeEmptyOption?: boolean;
  name: string;
  required?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? (includeEmptyOption ? "" : categories[0]?.id ?? ""));
  const selectedCategory = useMemo(() => categories.find((category) => category.id === selectedId) ?? null, [categories, selectedId]);

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        {selectedCategory ? (
          <CategoryIcon
            categoryName={selectedCategory.name}
            kind={selectedCategory.kind}
            className="h-4.5 w-4.5"
            tone={selectedCategory.kind === "income" ? "success" : "danger"}
          />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" aria-hidden="true" />
        )}
      </span>
      <select
        name={name}
        required={required}
        value={selectedId}
        onChange={(event) => setSelectedId(event.target.value)}
        className="pl-11"
      >
        {includeEmptyOption ? <option value="">{emptyLabel ?? "No category"}</option> : null}
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
    </div>
  );
}
