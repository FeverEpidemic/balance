import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  verifyApiKeyMock,
  consumeChatApiRateLimitMock,
  createAdminClientMock,
  invalidateWalletReadCachesMock
} = vi.hoisted(() => ({
  verifyApiKeyMock: vi.fn(),
  consumeChatApiRateLimitMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  invalidateWalletReadCachesMock: vi.fn()
}));

vi.mock("@/lib/chat-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/chat-auth")>("@/lib/chat-auth");

  return {
    ...actual,
    verifyApiKey: verifyApiKeyMock
  };
});

vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");

  return {
    ...actual,
    consumeChatApiRateLimit: consumeChatApiRateLimitMock
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock
}));

vi.mock("@/lib/data/cache", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/cache")>("@/lib/data/cache");

  return {
    ...actual,
    invalidateWalletReadCaches: invalidateWalletReadCachesMock
  };
});

import { GET as getRekap } from "@/app/api/chat/rekap/route";
import { POST as postTransaction } from "@/app/api/chat/transaction/route";

function createRekapAdminClient() {
  return {
    from(table: string) {
      if (table === "wallet_members") {
        return {
          select() {
            return {
              eq() {
                return Promise.resolve({
                  data: [{ wallet_id: "wallet-1", role: "owner" }],
                  error: null
                });
              }
            };
          }
        };
      }

      if (table === "transactions") {
        return {
          select() {
            return {
              in() {
                return {
                  gte() {
                    return {
                      lte() {
                        return {
                          order() {
                            return Promise.resolve({
                              data: [
                                {
                                  id: "tx-1",
                                  wallet_id: "wallet-1",
                                  category_id: "cat-1",
                                  kind: "expense",
                                  amount: 15000,
                                  happened_at: "2026-06-06T10:00:00.000Z"
                                }
                              ],
                              error: null
                            });
                          }
                        };
                      }
                    };
                  }
                };
              }
            };
          }
        };
      }

      if (table === "categories") {
        return {
          select() {
            return {
              in() {
                return Promise.resolve({
                  data: [{ id: "cat-1", wallet_id: "wallet-1", name: "Makan", kind: "expense" }],
                  error: null
                });
              }
            };
          }
        };
      }

      if (table === "wallets") {
        return {
          select() {
            return {
              in() {
                return Promise.resolve({
                  data: [{ id: "wallet-1", name: "Dompet Utama" }],
                  error: null
                });
              }
            };
          }
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }
  };
}

describe("chat API rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps unauthorized requests at 401 without consuming quota", async () => {
    verifyApiKeyMock.mockResolvedValue(null);

    const response = await getRekap(
      new NextRequest("http://localhost:3000/api/chat/rekap")
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
    expect(consumeChatApiRateLimitMock).not.toHaveBeenCalled();
  });

  it("returns rate limit headers on successful chat reads", async () => {
    verifyApiKeyMock.mockResolvedValue({
      userId: "user-1",
      keyId: "key-1",
      name: "Hermes"
    });
    consumeChatApiRateLimitMock.mockResolvedValue({
      allowed: true,
      limit: 60,
      remaining: 59,
      resetAt: Date.UTC(2026, 5, 6, 10, 1, 0),
      usedRedis: true
    });
    createAdminClientMock.mockReturnValue(createRekapAdminClient());

    const response = await getRekap(
      new NextRequest("http://localhost:3000/api/chat/rekap?period=month", {
        headers: {
          authorization: "Bearer bal_valid"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("59");
    expect(response.headers.get("X-RateLimit-Reset")).toBe("1780740060");

    const payload = await response.json();
    expect(payload).toMatchObject({
      period: "month",
      wallets: ["wallet-1"],
      totalExpense: 15000,
      totalIncome: 0,
      transactionCount: 1
    });
  });

  it("returns 429 for over-limit chat writes", async () => {
    verifyApiKeyMock.mockResolvedValue({
      userId: "user-1",
      keyId: "key-1",
      name: "Hermes"
    });
    consumeChatApiRateLimitMock.mockResolvedValue({
      allowed: false,
      limit: 60,
      remaining: 0,
      resetAt: Date.UTC(2026, 5, 6, 10, 1, 0),
      usedRedis: true
    });

    const response = await postTransaction(
      new NextRequest("http://localhost:3000/api/chat/transaction", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer bal_valid"
        },
        body: JSON.stringify({
          wallet_id: "wallet-1",
          amount: 10000,
          kind: "expense"
        })
      })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "rate_limited" });
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(createAdminClientMock).not.toHaveBeenCalled();
    expect(invalidateWalletReadCachesMock).not.toHaveBeenCalled();
  });
});
