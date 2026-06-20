"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Animates a number from its CURRENT displayed value to the target value.
 * Handles mid-animation value changes gracefully by aborting the old animation
 * and starting fresh from the current display value.
 *
 * Uses requestAnimationFrame with ease-out cubic curve (~400ms).
 * Respects prefers-reduced-motion: skips animation entirely.
 */
export function AnimatedNumber({
  value,
  formatter = (v) => String(v),
  className,
  duration = 400,
}: {
  value: number;
  formatter?: (value: number) => string;
  className?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const rafId = useRef<number | undefined>(undefined);
  // Track the CURRENT display value to use as animation start point
  const currentDisplayRef = useRef(value);

  useEffect(() => {
    // Respect reduced-motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      currentDisplayRef.current = value;
      return;
    }

    // Abort any in-flight animation
    if (rafId.current) cancelAnimationFrame(rafId.current);

    const startValue = currentDisplayRef.current;
    const diff = value - startValue;
    if (diff === 0) return;

    const startTime = performance.now();
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * eased);
      setDisplayValue(current);
      currentDisplayRef.current = current;
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        currentDisplayRef.current = value;
      }
    }
    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {formatter(displayValue)}
    </span>
  );
}
