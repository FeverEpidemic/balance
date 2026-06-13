"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatCurrencyInputValue, sanitizeCurrencyInput } from "@/lib/utils";
import { Input } from "@/components/ui/shadcn/input";

type CurrencyInputProps = {
  allowNegative?: boolean;
  className?: string;
  defaultValue?: number | string | null;
  name: string;
  placeholder?: string;
  required?: boolean;
  currency?: string;
};

function sanitizeInput(value: string, allowNegative = false) {
  const trimmed = value.trim();

  if (!allowNegative) {
    return sanitizeCurrencyInput(trimmed);
  }

  const sign = trimmed.startsWith("-") ? "-" : "";
  const digits = trimmed.replace(/[^\d]/g, "");
  return digits ? `${sign}${digits}` : sign;
}

function toInitialDisplayValue(value?: number | string | null, currency?: string, allowNegative = false) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const normalized = sanitizeInput(String(value), allowNegative);

  if (!normalized || normalized === "-") {
    return "";
  }

  return formatCurrencyInputValue(Number(normalized), "id", currency);
}

export function CurrencyInput({ allowNegative = false, className, defaultValue, name, placeholder, required, currency }: CurrencyInputProps) {
  const [value, setValue] = useState(() => toInitialDisplayValue(defaultValue, currency, allowNegative));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(toInitialDisplayValue(defaultValue, currency, allowNegative));
  }, [defaultValue, currency, allowNegative]);

  useEffect(() => {
    const input = inputRef.current;

    if (!input?.form) {
      return;
    }

    const handleReset = () => {
      setValue(toInitialDisplayValue(defaultValue, currency, allowNegative));
    };

    input.form.addEventListener("reset", handleReset);
    return () => {
      input.form?.removeEventListener("reset", handleReset);
    };
  }, [defaultValue, currency, allowNegative]);

  return (
    <Input
      className={cn(className)}
      inputMode={allowNegative ? "decimal" : "numeric"}
      name={name}
      ref={inputRef}
      onChange={(event) => {
        const normalized = sanitizeInput(event.target.value, allowNegative);

        if (!normalized) {
          setValue("");
          return;
        }

        if (normalized === "-") {
          setValue("-");
          return;
        }

        setValue(formatCurrencyInputValue(Number(normalized), "id", currency));
      }}
      placeholder={placeholder}
      required={required}
      type="text"
      value={value}
    />
  );
}
