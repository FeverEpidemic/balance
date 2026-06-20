import { beforeEach, describe, expect, it, vi } from "vitest";
import { savePushSubscriptionAction, deletePushSubscriptionAction, updateReminderPreferencesAction } from "@/app/actions/reminders";

const {
  requireUserMock,
  invalidateSettingsCacheMock,
  invalidateShellDataCacheMock,
  revalidatePathMock,
  upsertMock,
  deleteMock,
  updateMock,
  eqMock,
  fromMock,
  getActionLocaleMock
} = vi.hoisted(() => {
  const eqMock = vi.fn();
  const upsertMock = vi.fn();
  const deleteMock = vi.fn();
  const updateMock = vi.fn();
  const fromMock = vi.fn();

  const chainObj = {
    eq: eqMock,
    then: (resolve: any) => resolve({ error: null })
  };

  upsertMock.mockReturnValue({ error: null });
  deleteMock.mockReturnValue({ eq: eqMock });
  updateMock.mockReturnValue({ eq: eqMock });
  eqMock.mockReturnValue(chainObj);
  
  fromMock.mockReturnValue({
    upsert: upsertMock,
    delete: deleteMock,
    update: updateMock
  });

  return {
    requireUserMock: vi.fn(),
    invalidateSettingsCacheMock: vi.fn(),
    invalidateShellDataCacheMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    upsertMock,
    deleteMock,
    updateMock,
    eqMock,
    fromMock,
    getActionLocaleMock: vi.fn()
  };
});

vi.mock("@/lib/auth", () => ({
  requireUser: requireUserMock
}));

vi.mock("@/lib/data/cache", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/cache")>("@/lib/data/cache");
  return {
    ...actual,
    invalidateSettingsCache: invalidateSettingsCacheMock,
    invalidateShellDataCache: invalidateShellDataCacheMock
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("@/app/actions/_shared", () => ({
  requireUser: requireUserMock,
  getActionLocale: getActionLocaleMock,
  errorResult: (message: string) => ({ status: "error", message }),
  successResult: (message: string) => ({ status: "success", message })
}));

vi.mock("@/lib/i18n", () => ({
  localizePath: (locale: string, path: string) => `/${locale}${path}`,
  translate: (_locale: string, key: string) => key
}));

describe("Reminders Server Actions", () => {
  const mockUser = { id: "user-123", email: "user@example.com" };
  const mockSupabase = { from: fromMock };

  beforeEach(() => {
    vi.clearAllMocks();
    requireUserMock.mockResolvedValue({ supabase: mockSupabase, user: mockUser });
    getActionLocaleMock.mockResolvedValue("id");
  });

  describe("savePushSubscriptionAction", () => {
    it("should successfully save a subscription with valid keys", async () => {
      upsertMock.mockResolvedValue({ error: null });

      const result = await savePushSubscriptionAction("https://example.com/endpoint", "p256dhKey", "authKey");

      expect(fromMock).toHaveBeenCalledWith("push_subscriptions");
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          endpoint: "https://example.com/endpoint",
          p256dh: "p256dhKey",
          auth: "authKey"
        }),
        { onConflict: "endpoint" }
      );
      expect(result.status).toBe("success");
    });

    it("should return error when database upsert fails", async () => {
      upsertMock.mockResolvedValue({ error: new Error("DB Error") });

      const result = await savePushSubscriptionAction("https://example.com/endpoint", "p256dhKey", "authKey");

      expect(result.status).toBe("error");
    });

    it("should return error if arguments are empty", async () => {
      const result = await savePushSubscriptionAction("", "", "");
      expect(result.status).toBe("error");
    });
  });

  describe("deletePushSubscriptionAction", () => {
    it("should successfully delete a subscription for the given endpoint", async () => {
      const result = await deletePushSubscriptionAction("https://example.com/endpoint");

      expect(fromMock).toHaveBeenCalledWith("push_subscriptions");
      expect(deleteMock).toHaveBeenCalled();
      expect(result.status).toBe("success");
    });

    it("should return error if endpoint is missing", async () => {
      const result = await deletePushSubscriptionAction("");
      expect(result.status).toBe("error");
    });
  });

  describe("updateReminderPreferencesAction", () => {
    it("should successfully enable daily reminder with valid time", async () => {
      const result = await updateReminderPreferencesAction(true, "20:00");

      expect(fromMock).toHaveBeenCalledWith("profiles");
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          daily_reminder_enabled: true,
          daily_reminder_time: "20:00:00"
        })
      );
      expect(invalidateSettingsCacheMock).toHaveBeenCalledWith(mockUser.id);
      expect(invalidateShellDataCacheMock).toHaveBeenCalledWith(mockUser.id);
      expect(revalidatePathMock).toHaveBeenCalledWith("/id/settings");
      expect(result.status).toBe("success");
    });

    it("should return error for invalid time format", async () => {
      const result = await updateReminderPreferencesAction(true, "25:00");

      expect(fromMock).not.toHaveBeenCalledWith("profiles");
      expect(result.status).toBe("error");
      expect(result.message).toContain("Format waktu tidak valid");
    });

    it("should successfully disable daily reminder", async () => {
      const result = await updateReminderPreferencesAction(false, "20:00");

      expect(fromMock).toHaveBeenCalledWith("profiles");
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          daily_reminder_enabled: false,
          daily_reminder_time: "20:00:00"
        })
      );
      expect(result.status).toBe("success");
    });
  });
});
