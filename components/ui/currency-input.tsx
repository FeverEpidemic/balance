"use client";

import { useEffect, useRef, useState } from "react";
import { cn, formatCurrencyInputValue, sanitizeCurrencyInput } from "@/lib/utils";

type CurrencyInputProps = {
  className?: string;
  defaultValue?: number | string | null;
  name: string;
  placeholder?: string;
  required?: boolean;
};

function toInitialDisplayValue(value?: number | string | null) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const digits = sanitizeCurrencyInput(String(value));
  return digits ? formatCurrencyInputValue(digits) : "";
}

export function CurrencyInput({ className, defaultValue, name, placeholder, required }: CurrencyInputProps) {
  const [value, setValue] = useState(() => toInitialDisplayValue(defaultValue));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(toInitialDisplayValue(defaultValue));
  }, [defaultValue]);

  useEffect(() => {
    const input = inputRef.current;

    if (!input?.form) {
      return;
    }

    const handleReset = () => {
      setValue(toInitialDisplayValue(defaultValue));
    };

    input.form.addEventListener("reset", handleReset);
    return () => {
      input.form?.removeEventListener("reset", handleReset);
    };
  }, [defaultValue]);

  return (
    <input
      className={cn(className)}
      inputMode="numeric"
      name={name}
      ref={inputRef}
      onChange={(event) => {
        const digits = sanitizeCurrencyInput(event.target.value);
        setValue(digits ? formatCurrencyInputValue(digits) : "");
      }}
      placeholder={placeholder}
      required={required}
      type="text"
      value={value}
    />
  );
}
