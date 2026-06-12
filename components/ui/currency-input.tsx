"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatCurrencyInputValue, sanitizeCurrencyInput } from "@/lib/utils";
import { Input } from "@/components/ui/shadcn/input";

type CurrencyInputProps = {
  className?: string;
  defaultValue?: number | string | null;
  name: string;
  placeholder?: string;
  required?: boolean;
  currency?: string;
};

function toInitialDisplayValue(value?: number | string | null, currency?: string) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const digits = sanitizeCurrencyInput(String(value));
  return digits ? formatCurrencyInputValue(digits, "id", currency) : "";
}

export function CurrencyInput({ className, defaultValue, name, placeholder, required, currency }: CurrencyInputProps) {
  const [value, setValue] = useState(() => toInitialDisplayValue(defaultValue, currency));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(toInitialDisplayValue(defaultValue, currency));
  }, [defaultValue, currency]);

  useEffect(() => {
    const input = inputRef.current;

    if (!input?.form) {
      return;
    }

    const handleReset = () => {
      setValue(toInitialDisplayValue(defaultValue, currency));
    };

    input.form.addEventListener("reset", handleReset);
    return () => {
      input.form?.removeEventListener("reset", handleReset);
    };
  }, [defaultValue, currency]);

  return (
    <Input
      className={cn(className)}
      inputMode="numeric"
      name={name}
      ref={inputRef}
      onChange={(event) => {
        const digits = sanitizeCurrencyInput(event.target.value);
        setValue(digits ? formatCurrencyInputValue(digits, "id", currency) : "");
      }}
      placeholder={placeholder}
      required={required}
      type="text"
      value={value}
    />
  );
}
