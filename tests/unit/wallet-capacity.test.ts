import { describe, expect, it } from "vitest";
import {
  MAX_WALLET_MEMBERS,
  WALLET_ACCEPT_INVITATION_FULL_MESSAGE,
  WALLET_CAPACITY_REACHED_MESSAGE,
  countPendingInvitations,
  getOccupiedWalletSlots,
  getRemainingWalletSlots,
  isWalletAtCapacity,
  summarizeWalletCapacity
} from "../../lib/wallet-capacity";
import type { InvitationRow, WalletMemberRow } from "../../lib/data/types";

const members: WalletMemberRow[] = [
  { wallet_id: "w1", user_id: "u1", role: "owner" },
  { wallet_id: "w1", user_id: "u2", role: "editor" },
  { wallet_id: "w1", user_id: "u3", role: "viewer" }
];

const invitations: InvitationRow[] = [
  {
    id: "i1",
    wallet_id: "w1",
    role: "viewer",
    token: "token-1",
    status: "pending",
    invited_by: "u1",
    expires_at: "2026-06-05T00:00:00.000Z",
    created_at: "2026-05-29T00:00:00.000Z"
  },
  {
    id: "i2",
    wallet_id: "w1",
    role: "editor",
    token: "token-2",
    status: "accepted",
    invited_by: "u1",
    expires_at: "2026-06-05T00:00:00.000Z",
    created_at: "2026-05-29T01:00:00.000Z"
  },
  {
    id: "i3",
    wallet_id: "w1",
    role: "viewer",
    token: "token-3",
    status: "pending",
    invited_by: "u1",
    expires_at: "2026-06-05T00:00:00.000Z",
    created_at: "2026-05-29T02:00:00.000Z"
  }
];

describe("wallet capacity", () => {
  it("counts pending invitations only", () => {
    expect(countPendingInvitations(invitations)).toBe(2);
  });

  it("computes occupied and remaining slots including owner", () => {
    expect(getOccupiedWalletSlots(4, 1)).toBe(MAX_WALLET_MEMBERS);
    expect(getRemainingWalletSlots(3, 1)).toBe(1);
    expect(isWalletAtCapacity(4, 1)).toBe(true);
    expect(isWalletAtCapacity(3, 1)).toBe(false);
  });

  it("summarizes wallet capacity from members and invitations", () => {
    expect(summarizeWalletCapacity(members, invitations)).toEqual({
      memberCount: 3,
      pendingInvitationCount: 2,
      occupiedSlots: 5,
      remainingSlots: 0,
      isFull: true
    });
  });

  it("exposes consistent user-facing messages", () => {
    expect(WALLET_CAPACITY_REACHED_MESSAGE).toContain(String(MAX_WALLET_MEMBERS));
    expect(WALLET_ACCEPT_INVITATION_FULL_MESSAGE).toContain("penuh");
  });
});
