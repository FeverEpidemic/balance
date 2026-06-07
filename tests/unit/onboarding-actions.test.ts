import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireUserMock,
  invalidateDashboardCacheMock,
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
    invalidateDashboardCacheMock: vi.fn(),
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
    invalidateDashboardCache: invalidateDashboardCacheMock
  };
});

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

import { completeOnboarding, dismissOnboarding } from "@/app/actions/onboarding";

describe("onboarding actions", () => {
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

  it("dismisses onboarding and invalidates the dashboard cache", async () => {
    await dismissOnboarding();

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_state: "dismissed",
        onboarding_dismissed_at: expect.any(String)
      })
    );
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(invalidateDashboardCacheMock).toHaveBeenCalledWith(["user-1"]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/dashboard");
  });

  it("completes onboarding and invalidates the dashboard cache", async () => {
    await completeOnboarding();

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        onboarding_state: "completed",
        onboarding_completed_at: expect.any(String)
      })
    );
    expect(eqMock).toHaveBeenCalledWith("id", "user-1");
    expect(invalidateDashboardCacheMock).toHaveBeenCalledWith(["user-1"]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/id/dashboard");
  });
});
