import { describe, expect, it } from "vitest";
import { getLocaleFromPathname, localizePath, resolvePreferredLocale, stripLocaleFromPath } from "../../lib/i18n";

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
    expect(resolvePreferredLocale({ pathname: "/settings", acceptLanguage: "fr-FR,fr;q=0.9" })).toBe("id");
  });
});
