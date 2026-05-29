import type { InvitationRow, WalletMemberRow } from "@/lib/data/types";

export const MAX_WALLET_MEMBERS = 5;
export const WALLET_CAPACITY_REACHED_MESSAGE = `Wallet ini sudah mencapai batas maksimum ${MAX_WALLET_MEMBERS} orang.`;
export const WALLET_ACCEPT_INVITATION_FULL_MESSAGE = "Wallet ini sudah penuh sehingga undangan belum bisa diterima.";

export function countPendingInvitations(invitations: InvitationRow[]) {
  return invitations.filter((invitation) => invitation.status === "pending").length;
}

export function getOccupiedWalletSlots(memberCount: number, pendingInvitationCount: number) {
  return memberCount + pendingInvitationCount;
}

export function getRemainingWalletSlots(memberCount: number, pendingInvitationCount: number) {
  return Math.max(MAX_WALLET_MEMBERS - getOccupiedWalletSlots(memberCount, pendingInvitationCount), 0);
}

export function isWalletAtCapacity(memberCount: number, pendingInvitationCount: number) {
  return getOccupiedWalletSlots(memberCount, pendingInvitationCount) >= MAX_WALLET_MEMBERS;
}

export function summarizeWalletCapacity(members: WalletMemberRow[], invitations: InvitationRow[]) {
  const memberCount = members.length;
  const pendingInvitationCount = countPendingInvitations(invitations);
  const occupiedSlots = getOccupiedWalletSlots(memberCount, pendingInvitationCount);

  return {
    memberCount,
    pendingInvitationCount,
    occupiedSlots,
    remainingSlots: getRemainingWalletSlots(memberCount, pendingInvitationCount),
    isFull: occupiedSlots >= MAX_WALLET_MEMBERS
  };
}
