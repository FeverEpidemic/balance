import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireUserMock,
  invalidateSettingsCacheMock,
  revalidatePathMock,
  updateMock,
  eqMock,
  fromMock
} = vi.hoisted(() => {
  const eqMock = vi.fn();
  const updateMock = vi.fn();
  const fromMock = vi.fn();

  updateMock.mockReturnValue({ eq: eqMock });
  fromMock.mockReturnValue({ update: updateMock });
  eqMock.mockResolvedValue({ error: null });

  return {
    requireUserMock: vi.fn(),
    invalidateSettingsCacheMock: vi.fn(),
    revalidatePathMock: vi.fn(),
    updateMock,
    eqMock,
    fromMock
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

import { AI_CHAT_CONSENT_VERSION } from "@/lib/ai/compliance";
import { acceptAiChatConsentAndEnable, disableAiChat } from "@/app/actions/ai-compliance";

describe("ai compliance actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqMock.mockResolvedValue({ error: null });
    updateMock.mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ update: updateMock });
    requireUserMock.mockResolvedValue({
      user: { id: "user-1" },
      supabase: {
        from: fromMock
      }
    });
  });

  it("accepts consent, enables AI chat, and revalidates related pages", async () => {
    const result = await acceptAiChatConsentAndEnable({ status: "idle" }, new FormData());

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ai_chat_enabled: true,
        ai_chat_consent_version: AI_CHAT_CONSENT_VERSION,
        ai_chat_consented_at: expect.any(String)
      })
    );
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(invalidateSettingsCacheMock).toHaveBeenCalledWith("user-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/settings");
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/chat");
    expect(result.status).toBe("success");
  });

  it("disables AI chat without clearing stored consent", async () => {
    const result = await disableAiChat({ status: "idle" }, new FormData());

    expect(updateMock).toHaveBeenCalledWith({ ai_chat_enabled: false });
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(invalidateSettingsCacheMock).toHaveBeenCalledWith("user-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/settings");
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/chat");
    expect(result.status).toBe("success");
  });
});
