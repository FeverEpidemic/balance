"use client";

import { useState } from "react";
import { CATEGORY_COLOR_PALETTE } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/shadcn/radio-group";

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
  const [selectedColor, setSelectedColor] = useState(defaultValue);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedColor} />
      <RadioGroup
        value={selectedColor}
        onValueChange={(value) => setSelectedColor(value)}
        className="flex flex-wrap gap-2"
        required={required}
      >
        {colors.map((color) => {
          const isSelected = color.toLowerCase() === selectedColor.toLowerCase();

          return (
            <label key={color} className="cursor-pointer">
              <RadioGroupItem
                value={color}
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
      </RadioGroup>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: selectedColor }} />
        <span>{selectedColor}</span>
      </div>
    </div>
  );
}
