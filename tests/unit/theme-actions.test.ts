import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireUserMock,
  invalidateSettingsCacheMock,
  revalidatePathMock,
  updateMock,
  eqMock,
  fromMock,
  cookiesMock,
  cookieSetMock
} = vi.hoisted(() => {
  const eqMock = vi.fn();
  const updateMock = vi.fn();
  const fromMock = vi.fn();
  const cookieSetMock = vi.fn();
  const cookiesMock = vi.fn();

  updateMock.mockReturnValue({ eq: eqMock });
  fromMock.mockReturnValue({ update: updateMock });
  eqMock.mockResolvedValue({ error: null });
  cookiesMock.mockResolvedValue({ set: cookieSetMock });

  return {
    requireUserMock: vi.fn(),
    invalidateSettingsCacheMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    updateMock,
    eqMock,
    fromMock,
    cookiesMock,
    cookieSetMock
  };
});

vi.mock("@/lib/auth", () => ({
  requireUser: requireUserMock
}));

vi.mock("@/lib/data/cache", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/cache")>("@/lib/data/cache");

  return {
    ...actual,
    invalidateSettingsCache: invalidateSettingsCacheMock
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

import { updateThemePreference } from "@/app/actions/theme";

describe("theme actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });
    cookiesMock.mockResolvedValue({ set: cookieSetMock });
    requireUserMock.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {
        from: fromMock
      }
    });
  });

  it("updates theme preference, mirrors the cookie, and invalidates settings", async () => {
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
    expect(revalidatePathMock).toHaveBeenCalledWith("/settings");
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
    expect(result).toEqual({
      status: "error",
      message: "Pilihan tema tidak valid.",
      fieldErrors: undefined
    });
  });
});
