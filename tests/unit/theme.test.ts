import { describe, expect, it } from "vitest";
import { getThemeBootstrapScript, parseThemePreference, resolveAppliedTheme } from "@/lib/theme";

describe("theme helpers", () => {
  it("parses only supported preferences", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference("unexpected")).toBe("system");
    expect(parseThemePreference(undefined)).toBe("system");
  });

  it("resolves explicit light and dark themes directly", () => {
    expect(resolveAppliedTheme("light", { systemTheme: "dark" })).toBe("light");
    expect(resolveAppliedTheme("dark", { systemTheme: "light" })).toBe("dark");
  });

  it("resolves system using the provided system theme", () => {
    expect(resolveAppliedTheme("system", { systemTheme: "dark" })).toBe("dark");
    expect(resolveAppliedTheme("system", { systemTheme: "light" })).toBe("light");
  });

  it("falls back safely to light when preference or system theme is unavailable", () => {
    expect(resolveAppliedTheme(undefined)).toBe("light");
    expect(resolveAppliedTheme("unexpected", { systemTheme: null })).toBe("light");
  });

  it("builds bootstrap script with the initial preference", () => {
    expect(getThemeBootstrapScript("system")).toContain("\"system\"");
    expect(getThemeBootstrapScript("light")).toContain("balance-theme");
  });
});
