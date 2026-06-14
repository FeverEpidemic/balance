"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryIcon } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";

type CategoryOption = {
  id: string;
  name: string;
  kind: "income" | "expense";
};

const NO_CATEGORY_SENTINEL = "__none__";

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
  const inputRef = useRef<HTMLInputElement>(null);

  const resolveInitial = () => {
    if (defaultValue) return defaultValue;
    if (includeEmptyOption) return NO_CATEGORY_SENTINEL;
    return categories[0]?.id ?? "";
  };
  const [selectedId, setSelectedId] = useState(resolveInitial);

  useEffect(() => {
    setSelectedId(resolveInitial());
  }, [defaultValue, includeEmptyOption, categories]);

  useEffect(() => {
    const input = inputRef.current;

    if (!input?.form) {
      return;
    }

    const handleReset = () => {
      setSelectedId(resolveInitial());
    };

    input.form.addEventListener("reset", handleReset);
    return () => {
      input.form?.removeEventListener("reset", handleReset);
    };
  }, [defaultValue, includeEmptyOption, categories]);

  const selectedCategory = useMemo(() => categories.find((category) => category.id === selectedId) ?? null, [categories, selectedId]);

  return (
    <div className={cn("relative", className)}>
      <input ref={inputRef} type="hidden" name={name} value={selectedId === NO_CATEGORY_SENTINEL ? "" : selectedId} />
      <Select
        value={selectedId}
        onValueChange={(value) => setSelectedId(value)}
        required={required}
      >
        <SelectTrigger className="relative min-h-[3.25rem] pl-11">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
          </div>
          <SelectValue placeholder={emptyLabel ?? "Pilih kategori"} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {includeEmptyOption ? (
              <SelectItem value={NO_CATEGORY_SENTINEL}>
                <SelectItemText>{emptyLabel ?? "No category"}</SelectItemText>
              </SelectItem>
            ) : null}
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <CategoryIcon
                  categoryName={category.name}
                  kind={category.kind}
                  className="h-4 w-4 shrink-0"
                  tone={category.kind === "income" ? "success" : "danger"}
                />
                <SelectItemText>{category.name}</SelectItemText>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
