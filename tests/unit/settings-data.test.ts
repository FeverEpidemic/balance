import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getOrSetMock,
  queryProfilesMock,
  queryUserApiKeysMock
} = vi.hoisted(() => ({
  getOrSetMock: vi.fn(),
  queryProfilesMock: vi.fn(),
  queryUserApiKeysMock: vi.fn()
}));

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");

  return {
    ...actual,
    cache: <T extends (...args: any[]) => any>(fn: T) => fn
  };
});

vi.mock("@/lib/redis", () => ({
  redisCache: {
    getOrSet: getOrSetMock
  }
}));

vi.mock("@/lib/data/queries", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/queries")>("@/lib/data/queries");

  return {
    ...actual,
    queryProfiles: queryProfilesMock,
    queryUserApiKeys: queryUserApiKeysMock
  };
});

import { getSettingsData } from "@/lib/data";

describe("getSettingsData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefers fresh profile preferences over stale shell cache values", async () => {
    const staleShell = {
      userName: "Ilham",
      walletCount: 2,
      budgetCount: 5,
      memberCount: 3,
      primaryWalletId: "wallet-1",
      preferredLocale: "id" as const,
      themePreference: "light" as const,
      timezone: "Asia/Jakarta",
      defaultCurrency: "IDR"
    };

    queryUserApiKeysMock.mockResolvedValue([
      {
        id: "key-1",
        name: "Primary",
        key_hash: "hash",
        key_prefix: "bal_123",
        created_at: "2026-06-16T00:00:00.000Z",
        last_used_at: null,
        revoked_at: null
      }
    ]);
    queryProfilesMock.mockResolvedValue([
      {
        id: "user-1",
        full_name: "Ilham",
        email: "ilham@example.com",
        preferred_locale: "en" as const,
        theme_preference: "dark" as const,
        onboarding_state: "active" as const,
        onboarding_dismissed_at: null,
        onboarding_completed_at: null,
        timezone: "Asia/Singapore",
        default_currency: "USD",
        ai_chat_enabled: true,
        ai_chat_consent_version: "v1",
        ai_chat_consented_at: "2026-06-16T00:00:00.000Z",
        plan_type: "free" as const,
        trial_started_at: null,
        trial_ends_at: null,
        trial_consumed_at: null,
        daily_reminder_enabled: false,
        daily_reminder_time: "20:00:00"
      }
    ]);
    getOrSetMock.mockImplementation(async (key: string, _ttl: number, loader: () => Promise<unknown>) => {
      if (key === "user:user-1:settings") {
        return loader();
      }

      if (key === "user:user-1:shell") {
        return staleShell;
      }

      throw new Error(`Unexpected cache key: ${key}`);
    });

    const settings = await getSettingsData("user-1");

    expect(settings.shell).toMatchObject(staleShell);
    expect(settings.preferredLocale).toBe("en");
    expect(settings.themePreference).toBe("dark");
    expect(settings.timezone).toBe("Asia/Singapore");
    expect(settings.defaultCurrency).toBe("USD");
    expect(settings.apiKeys).toEqual([
      {
        id: "key-1",
        name: "Primary",
        keyPrefix: "bal_123",
        createdAt: "2026-06-16T00:00:00.000Z",
        lastUsedAt: null,
        isRevoked: false
      }
    ]);
  });
});
