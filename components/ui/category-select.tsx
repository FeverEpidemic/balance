"use client";

import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

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
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedId} />
      <Select
        value={selectedId}
        onValueChange={(value) => setSelectedId(value)}
        required={required}
      >
        <SelectTrigger className="pl-11 min-h-[3.25rem]">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
          <SelectValue placeholder={emptyLabel ?? "Pilih kategori"} />
        </SelectTrigger>
        <SelectContent>
          {includeEmptyOption ? (
            <SelectItem value="">{emptyLabel ?? "No category"}</SelectItem>
          ) : null}
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <div className="flex items-center gap-2">
                <CategoryIcon
                  categoryName={category.name}
                  kind={category.kind}
                  className="h-4 w-4"
                  tone={category.kind === "income" ? "success" : "danger"}
                />
                <span>{category.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
