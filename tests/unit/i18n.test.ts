import { afterEach, describe, expect, it, vi } from "vitest";
import { getLocaleFromPathname, localizePath, resolvePreferredLocale, stripLocaleFromPath, translate } from "../../lib/i18n";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("i18n routing helpers", () => {
  it("detects and strips locale prefixes from paths", () => {
    expect(getLocaleFromPathname("/en/dashboard")).toBe("en");
    expect(getLocaleFromPathname("/dashboard")).toBeNull();
    expect(stripLocaleFromPath("/en/wallets/123")).toBe("/wallets/123");
    expect(stripLocaleFromPath("/id")).toBe("/");
  });

  it("builds localized paths without duplicating prefixes", () => {
    expect(localizePath("id", "/dashboard")).toBe("/id/dashboard");
    expect(localizePath("en", "/id/dashboard")).toBe("/en/dashboard");
  });

  it("resolves locale precedence from pathname to profile to cookie to browser", () => {
    expect(resolvePreferredLocale({ pathname: "/en/settings", profileLocale: "id", cookieLocale: "id" })).toBe("en");
    expect(resolvePreferredLocale({ pathname: "/settings", profileLocale: "en", cookieLocale: "id" })).toBe("en");
    expect(resolvePreferredLocale({ pathname: "/settings", cookieLocale: "en" })).toBe("en");
    expect(resolvePreferredLocale({ pathname: "/settings", acceptLanguage: "en-US,en;q=0.9,id;q=0.8" })).toBe("en");
    expect(resolvePreferredLocale({ pathname: "/settings", acceptLanguage: "ben-IN,ben;q=0.9" })).toBe("id");
    expect(resolvePreferredLocale({ pathname: "/settings", acceptLanguage: "fr-FR,fr;q=0.9" })).toBe("id");
  });

  it("warns in development when a translation key resolves to an object", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const originalNodeEnv = process.env.NODE_ENV;

    process.env.NODE_ENV = "development";
    expect(translate("id", "settings")).toBe("settings");
    expect(warnSpy).toHaveBeenCalledWith('Translation key "settings" for locale "id" resolved to a non-string value.');

    process.env.NODE_ENV = originalNodeEnv;
  });
});
