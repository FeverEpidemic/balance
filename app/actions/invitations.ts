"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
import { sendInviteEmail } from "@/lib/email";

function withMessage(path: string, type: "error" | "message", message: string) {
  return `${path}?${new URLSearchParams({ [type]: message }).toString()}`;
}

export async function createInvitation(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "viewer") as "editor" | "viewer";

  console.log("createInvitation:start", { walletId, email, role });

  if (!walletId || !email) {
    console.warn("createInvitation:missing-fields", { walletId, email });
    redirect(withMessage(`/wallets/${walletId}/members`, "error", "Email dan wallet wajib diisi."));
  }

  if (!email.includes("@")) {
    console.warn("createInvitation:invalid-email", { walletId, email });
    redirect(withMessage(`/wallets/${walletId}/members`, "error", "Format email tidak valid."));
  }

  const { supabase, user } = await requireUser();

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("id, name")
    .eq("id", walletId)
    .single();

  if (walletError || !wallet) {
    console.warn("createInvitation:wallet-not-found", { walletId, walletError });
    redirect(withMessage("/wallets", "error", "Wallet tidak ditemukan."));
  }

  const { data: existingMember } = await supabase
    .from("wallet_members")
    .select("user_id")
    .eq("wallet_id", walletId);

  const memberUserIds = (existingMember ?? []).map((m) => m.user_id);

  const { data: existingProfiles } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email);

  if (existingProfiles && existingProfiles.length > 0) {
    const invitedProfile = existingProfiles[0];
    if (memberUserIds.includes(invitedProfile.id)) {
      console.warn("createInvitation:already-member", { walletId, email, invitedProfileId: invitedProfile.id });
      redirect(withMessage(`/wallets/${walletId}/members`, "error", "Pengguna sudah menjadi anggota wallet ini."));
    }
  }

  const { data: pendingInvite } = await supabase
    .from("wallet_invitations")
    .select("id")
    .eq("wallet_id", walletId)
    .eq("invited_email", email)
    .eq("status", "pending")
    .single();

  if (pendingInvite) {
    console.warn("createInvitation:pending-invite-exists", { walletId, email, invitationId: pendingInvite.id });
    redirect(withMessage(`/wallets/${walletId}/members`, "error", "Undangan untuk email ini masih aktif."));
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const invitationPayload = {
    wallet_id: walletId,
    invited_email: email,
    role,
    token,
    status: "pending",
    invited_by: user.id,
    expires_at: expiresAt,
    created_by: user.id,
    updated_by: user.id
  };

  const { error: inviteError } = await supabase.from("wallet_invitations").insert(invitationPayload);

  if (inviteError) {
    console.error("createInvitation:insert-failed", { walletId, email, inviteError });
    redirect(withMessage(`/wallets/${walletId}/members`, "error", inviteError.message));
  }

  const inviterName = user.email ?? "Seseorang";

  console.log("createInvitation:before-send-email", {
    walletId,
    email,
    role,
    token,
    inviterName
  });

  try {
    await sendInviteEmail({
      to: email,
      walletName: wallet.name,
      inviterName,
      role,
      token
    });
    console.log("createInvitation:email-sent", { walletId, email, token });
  } catch (error) {
    console.error("Gagal mengirim email undangan wallet", {
      walletId,
      invitedEmail: email,
      error
    });

    await supabase
      .from("wallet_invitations")
      .update({ status: "revoked", updated_by: user.id })
      .eq("wallet_id", walletId)
      .eq("token", token)
      .eq("status", "pending");

    redirect(withMessage(`/wallets/${walletId}/members`, "error", "Gagal mengirim email undangan. Periksa konfigurasi SMTP."));
  }

  revalidatePath(`/wallets/${walletId}/members`);
  redirect(withMessage(`/wallets/${walletId}/members`, "message", `Undangan berhasil dikirim ke ${email}.`));
}

export async function acceptInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    redirect(withMessage("/wallets", "error", "Token undangan tidak valid."));
  }

  const { supabase, user } = await requireUser();

  const { data: invitation, error: inviteError } = await supabase
    .from("wallet_invitations")
    .select("id, wallet_id, invited_email, role, status, expires_at")
    .eq("token", token)
    .single();

  if (inviteError || !invitation) {
    redirect(withMessage("/wallets", "error", "Undangan tidak ditemukan."));
  }

  if (invitation.status !== "pending") {
    const statusLabels: Record<string, string> = {
      accepted: "sudah diterima",
      revoked: "sudah dibatalkan",
      expired: "sudah kedaluwarsa"
    };
    const label = statusLabels[invitation.status] ?? invitation.status;
    redirect(withMessage("/wallets", "error", `Undangan ${label}.`));
  }

  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from("wallet_invitations")
      .update({ status: "expired", updated_by: user.id })
      .eq("id", invitation.id);
    redirect(withMessage("/wallets", "error", "Undangan sudah kedaluwarsa."));
  }

  const userEmail = user.email?.toLowerCase();
  if (invitation.invited_email.toLowerCase() !== userEmail) {
    redirect(withMessage("/wallets", "error", "Undangan ini ditujukan untuk email lain. Silakan login dengan email yang diundang."));
  }

  const { data: existingMember } = await supabase
    .from("wallet_members")
    .select("id")
    .eq("wallet_id", invitation.wallet_id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    await supabase
      .from("wallet_invitations")
      .update({ status: "accepted", accepted_by: user.id, updated_by: user.id })
      .eq("id", invitation.id);
    redirect(withMessage(`/wallets/${invitation.wallet_id}`, "message", "Anda sudah menjadi anggota wallet ini."));
  }

  const { error: memberError } = await supabase.from("wallet_members").insert({
    wallet_id: invitation.wallet_id,
    user_id: user.id,
    role: invitation.role,
    created_by: user.id,
    updated_by: user.id
  });

  if (memberError) {
    redirect(withMessage("/wallets", "error", `Gagal bergabung ke wallet: ${memberError.message}`));
  }

  const { error: updateError } = await supabase
    .from("wallet_invitations")
    .update({ status: "accepted", accepted_by: user.id, updated_by: user.id })
    .eq("id", invitation.id);

  if (updateError) {
    redirect(withMessage(`/wallets/${invitation.wallet_id}`, "message", "Berhasil bergabung, tetapi status undangan gagal diperbarui."));
  }

  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  redirect(withMessage(`/wallets/${invitation.wallet_id}`, "message", "Selamat! Anda berhasil bergabung ke wallet."));
}

export async function revokeInvitation(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "").trim();
  const invitationId = String(formData.get("invitation_id") ?? "").trim();

  if (!walletId || !invitationId) {
    redirect(withMessage(`/wallets/${walletId}/members`, "error", "Data undangan tidak lengkap."));
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("wallet_invitations")
    .update({ status: "revoked", updated_by: user.id })
    .eq("id", invitationId)
    .eq("wallet_id", walletId)
    .eq("status", "pending");

  if (error) {
    redirect(withMessage(`/wallets/${walletId}/members`, "error", `Gagal membatalkan undangan: ${error.message}`));
  }

  revalidatePath(`/wallets/${walletId}/members`);
  redirect(withMessage(`/wallets/${walletId}/members`, "message", "Undangan berhasil dibatalkan."));
}
