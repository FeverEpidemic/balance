"use client";

import { useId, useState } from "react";
import { CATEGORY_COLOR_PALETTE } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function ColorPalette({
  className,
  colors = CATEGORY_COLOR_PALETTE,
  defaultValue = CATEGORY_COLOR_PALETTE[0],
  name,
  required
}: {
  className?: string;
  colors?: readonly string[];
  defaultValue?: string;
  name: string;
  required?: boolean;
}) {
  const baseId = useId();
  const [selectedColor, setSelectedColor] = useState(defaultValue);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => {
          const optionId = `${baseId}-${index}`;
          const isSelected = color.toLowerCase() === selectedColor.toLowerCase();

          return (
            <label key={color} htmlFor={optionId} className="cursor-pointer">
              <input
                id={optionId}
                type="radio"
                name={name}
                value={color}
                checked={isSelected}
                required={required}
                onChange={(event) => setSelectedColor(event.target.value)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border transition duration-150",
                  isSelected
                    ? "scale-[1.04] border-foreground/20 bg-card shadow-serene"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted"
                )}
              >
                <span className="h-6 w-6 rounded-full border border-black/5 dark:border-white/10" style={{ backgroundColor: color }} />
              </span>
            </label>
          );
        })}
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedColor }} />
        <span>{selectedColor}</span>
      </div>
    </div>
  );
}
