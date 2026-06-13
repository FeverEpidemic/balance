"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { getTranslator } from "@/lib/i18n";
import { THEME_COOKIE_NAME, type AppliedTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ThemeOption = {
  value: AppliedTheme;
  label: string;
  icon: typeof Sun;
};

function readThemeFromDom(): AppliedTheme {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function LandingThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const locale = useLocale();
  const t = getTranslator(locale);
  const [theme, setTheme] = useState<AppliedTheme>("light");

  useEffect(() => {
    setTheme(readThemeFromDom());
  }, []);

  const options: ThemeOption[] = [
    { value: "light", label: t("settings.themeLightLabel"), icon: Sun },
    { value: "dark", label: t("settings.themeDarkLabel"), icon: Moon }
  ];

  function applyTheme(nextTheme: AppliedTheme) {
    const html = document.documentElement;
    const expires = 60 * 60 * 24 * 365;

    document.cookie = `${THEME_COOKIE_NAME}=${nextTheme}; Path=/; Max-Age=${expires}; SameSite=Lax`;
    html.dataset.themePreference = nextTheme;
    html.dataset.theme = nextTheme;
    html.style.colorScheme = nextTheme;
    setTheme(nextTheme);
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-[color:var(--soft-border)] bg-[color:var(--surface-container-lowest)]/70 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
        mobile && "w-full justify-between rounded-[1.1rem] px-2 py-2"
      )}
      aria-label={t("common.theme")}
      role="group"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => applyTheme(option.value)}
            aria-pressed={isActive}
            aria-label={`${t("common.theme")}: ${option.label}`}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-3 py-2 font-label text-[11px] font-semibold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(89,95,61,0.16)]",
              mobile ? "min-h-11 flex-1" : "min-h-10",
              isActive
                ? "bg-[color:var(--primary-soft)] text-primary-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_10px_24px_-18px_rgba(45,54,39,0.46)]"
                : "text-muted-foreground hover:bg-[color:var(--primary-soft)]/70 hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
