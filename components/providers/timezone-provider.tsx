"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_TIMEZONE, resolveTimezone, TZ_COOKIE_NAME } from "@/lib/timezone";

const TimezoneContext = createContext<string>(DEFAULT_TIMEZONE);

function getHtmlTimezone(): string | null {
  if (typeof document === "undefined") return null;
  const tz = document.documentElement.getAttribute("data-tz");
  return tz || null;
}

function isFromProfileOverride(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.hasAttribute("data-tz");
}

/**
 * Provider timezone: auto-detect dari browser, simpan ke cookie buat SSR consistency.
 *
 * Priority chain:
 * 1. data-tz attribute on <html> — set server-side dari profiles.timezone
 * 2. balance-tz cookie — auto-detect dari browser
 * 3. Asia/Jakarta — fallback default
 */
export function TimezoneProvider({
  initialTimezone,
  children
}: {
  initialTimezone: string;
  children: React.ReactNode;
}) {
  // Prioritaskan data-tz dari server (profile override), lalu cookie, lalu default
  const htmlTz = getHtmlTimezone();
  const effectiveInitial = htmlTz || initialTimezone || DEFAULT_TIMEZONE;
  const [timezone, setTimezone] = useState(effectiveInitial);

  useEffect(() => {
    // Kalau timezone udah di-set manual via profile, jangan auto-detect
    if (isFromProfileOverride()) return;

    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const resolved = resolveTimezone(detected);

    if (resolved !== timezone) {
      setTimezone(resolved);
      document.cookie = `${TZ_COOKIE_NAME}=${resolved}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <TimezoneContext.Provider value={timezone}>{children}</TimezoneContext.Provider>;
}

/**
 * Hook untuk akses timezone user di client components.
 */
export function useTimezone() {
  return useContext(TimezoneContext);
}
