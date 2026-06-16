import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireUserMock,
  invalidateDashboardCacheMock,
  invalidateSettingsCacheMock,
  invalidateShellDataCacheMock,
  revalidatePathMock,
  redirectMock,
  updateMock,
  eqMock,
  fromMock,
  cookiesMock,
  cookieSetMock,
  cookieDeleteMock
} = vi.hoisted(() => {
  const eqMock = vi.fn();
  const updateMock = vi.fn();
  const fromMock = vi.fn();
  const cookieSetMock = vi.fn();
  const cookieDeleteMock = vi.fn();
  const cookiesMock = vi.fn();

  updateMock.mockReturnValue({ eq: eqMock });
  fromMock.mockReturnValue({ update: updateMock });
  eqMock.mockResolvedValue({ error: null });
  cookiesMock.mockResolvedValue({ get: vi.fn(), set: cookieSetMock, delete: cookieDeleteMock });

  return {
    requireUserMock: vi.fn(),
    invalidateDashboardCacheMock: vi.fn(),
    invalidateSettingsCacheMock: vi.fn(),
    invalidateShellDataCacheMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    redirectMock: vi.fn(),
    updateMock,
    eqMock,
    fromMock,
    cookiesMock,
    cookieSetMock,
    cookieDeleteMock
  };
});

vi.mock("@/lib/auth", () => ({
  requireUser: requireUserMock
}));

vi.mock("@/lib/data/cache", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/cache")>("@/lib/data/cache");

  return {
    ...actual,
    invalidateDashboardCache: invalidateDashboardCacheMock,
    invalidateSettingsCache: invalidateSettingsCacheMock,
    invalidateShellDataCache: invalidateShellDataCacheMock
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

import {
  updateDefaultCurrency,
  updateLocalePreference,
  updateThemePreference,
  updateTimezonePreference
} from "@/app/actions/theme";

describe("settings preference actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });
    cookiesMock.mockResolvedValue({ get: vi.fn(), set: cookieSetMock, delete: cookieDeleteMock });
    requireUserMock.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {
        from: fromMock
      }
    });
    redirectMock.mockImplementation(() => undefined);
  });

  it("updates theme preference, mirrors the cookie, and invalidates settings and shell caches", async () => {
    const formData = new FormData();
    formData.set("theme_preference", "dark");

    const result = await updateThemePreference({ status: "idle" }, formData);

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith({ theme_preference: "dark" });
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(cookieSetMock).toHaveBeenCalledWith(
      "balance-theme",
      "dark",
      expect.objectContaining({
        path: "/",
        sameSite: "lax"
      })
    );
    expect(invalidateSettingsCacheMock).toHaveBeenCalledWith("user-1");
    expect(invalidateShellDataCacheMock).toHaveBeenCalledWith("user-1");
    expect(invalidateDashboardCacheMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/settings");
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(result).toMatchObject({
      status: "success"
    });
  });

  it("redirects to the new locale after updating and clears stale settings and shell caches", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    redirectMock.mockImplementation(() => {
      throw redirectError;
    });
    const formData = new FormData();
    formData.set("preferred_locale", "en");

    await expect(updateLocalePreference({ status: "idle" }, formData)).rejects.toBe(redirectError);

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith({ preferred_locale: "en" });
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(cookieSetMock).toHaveBeenCalledWith(
      "balance-locale",
      "en",
      expect.objectContaining({
        path: "/",
        sameSite: "lax"
      })
    );
    expect(invalidateSettingsCacheMock).toHaveBeenCalledWith("user-1");
    expect(invalidateShellDataCacheMock).toHaveBeenCalledWith("user-1");
    expect(invalidateDashboardCacheMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/en/settings");
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(redirectMock).toHaveBeenCalledWith("/en/settings");
  });

  it("updates timezone and invalidates settings and shell caches", async () => {
    const formData = new FormData();
    formData.set("timezone", "Asia/Singapore");

    const result = await updateTimezonePreference({ status: "idle" }, formData);

    expect(updateMock).toHaveBeenCalledWith({ timezone: "Asia/Singapore" });
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(cookieSetMock).toHaveBeenCalledWith(
      "balance-tz",
      "Asia/Singapore",
      expect.objectContaining({
        path: "/",
        sameSite: "lax"
      })
    );
    expect(cookieDeleteMock).not.toHaveBeenCalled();
    expect(invalidateSettingsCacheMock).toHaveBeenCalledWith("user-1");
    expect(invalidateShellDataCacheMock).toHaveBeenCalledWith("user-1");
    expect(invalidateDashboardCacheMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/settings");
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(result).toMatchObject({
      status: "success"
    });
  });

  it("updates default currency and invalidates settings, shell, and dashboard caches", async () => {
    const formData = new FormData();
    formData.set("default_currency", "USD");

    const result = await updateDefaultCurrency({ status: "idle" }, formData);

    expect(updateMock).toHaveBeenCalledWith({ default_currency: "USD" });
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(invalidateSettingsCacheMock).toHaveBeenCalledWith("user-1");
    expect(invalidateShellDataCacheMock).toHaveBeenCalledWith("user-1");
    expect(invalidateDashboardCacheMock).toHaveBeenCalledWith(["user-1"]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/settings");
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(result).toMatchObject({
      status: "success"
    });
  });

  it("rejects invalid theme preferences before updating", async () => {
    const formData = new FormData();
    formData.set("theme_preference", "sepia");

    const result = await updateThemePreference({ status: "idle" }, formData);

    expect(fromMock).not.toHaveBeenCalled();
    expect(cookieSetMock).not.toHaveBeenCalled();
    expect(invalidateSettingsCacheMock).not.toHaveBeenCalled();
    expect(invalidateShellDataCacheMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: "error",
      message: "Pilihan tema tidak valid.",
      fieldErrors: undefined
    });
  });
});
