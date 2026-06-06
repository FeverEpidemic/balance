export const THEME_COOKIE_NAME = "balance-theme";

export const themePreferences = ["light", "dark", "system"] as const;

export type ThemePreference = (typeof themePreferences)[number];
export type AppliedTheme = "light" | "dark";

export function isThemePreference(value: string): value is ThemePreference {
  return themePreferences.includes(value as ThemePreference);
}

export function parseThemePreference(value: string | null | undefined): ThemePreference {
  if (value && isThemePreference(value)) {
    return value;
  }

  return "system";
}

export function resolveAppliedTheme(
  preference: string | null | undefined,
  options: {
    systemTheme?: AppliedTheme | null;
    fallbackTheme?: AppliedTheme;
  } = {}
): AppliedTheme {
  const parsedPreference = parseThemePreference(preference);
  const fallbackTheme = options.fallbackTheme ?? "light";

  if (parsedPreference === "light" || parsedPreference === "dark") {
    return parsedPreference;
  }

  return options.systemTheme ?? fallbackTheme;
}

export function getThemeBootstrapScript(initialPreference: ThemePreference) {
  return `
    (function () {
      var cookieName = ${JSON.stringify(THEME_COOKIE_NAME)};
      var initialPreference = ${JSON.stringify(initialPreference)};
      var html = document.documentElement;
      var readCookie = function (name) {
        var prefix = name + "=";
        var parts = document.cookie.split("; ");
        for (var index = 0; index < parts.length; index += 1) {
          if (parts[index].indexOf(prefix) === 0) {
            return decodeURIComponent(parts[index].slice(prefix.length));
          }
        }
        return null;
      };
      var rawPreference = readCookie(cookieName) || initialPreference;
      var preference = rawPreference === "light" || rawPreference === "dark" || rawPreference === "system" ? rawPreference : "system";
      var systemTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      var appliedTheme = preference === "system" ? systemTheme : preference;

      html.dataset.themePreference = preference;
      html.dataset.theme = appliedTheme;
      html.style.colorScheme = appliedTheme;
    })();
  `;
}
