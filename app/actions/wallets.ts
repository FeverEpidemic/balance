"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/env";
import { sendWalletInvitationEmail } from "@/lib/mailer";
import { ensureProfileForUser } from "@/lib/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMonthKey } from "@/lib/finance";
import { getBudgetPresetRows, getStarterCategories, getStarterTemplates, type BudgetPreset, type WalletSetupPreset } from "@/lib/wallet-starter-templates";
import { getStringValue, getTrimmedValue, redirectWithMessage } from "@/app/actions/_shared";

function readWalletForm(formData: FormData) {
  return {
    name: getTrimmedValue(formData, "name"),
    kind: (getStringValue(formData, "kind") || "personal") as "personal" | "shared",
    setupPreset: (getStringValue(formData, "setup_preset") || "standard") as WalletSetupPreset,
    budgetPreset: (getStringValue(formData, "budget_preset") || "balanced") as BudgetPreset
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function membersPath(walletId: string) {
  return `/wallets/${walletId}/members`;
}

function buildOrigin(headerStore: Headers) {
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (host) {
    const protocol = headerStore.get("x-forwarded-proto") ?? (getSiteUrl().startsWith("https://") ? "https" : "http");
    return `${protocol}://${host}`;
  }

  return getSiteUrl();
}

export async function createWallet(formData: FormData) {
  const { name, kind, setupPreset, budgetPreset } = readWalletForm(formData);
  const { supabase, user } = await requireUser();
  const profile = await ensureProfileForUser(user);

  if (!profile) {
    redirectWithMessage("/wallets", "error", "Profile belum sinkron. Jalankan migrasi 0002 atau isi SUPABASE_SECRET_KEY.");
  }

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .insert({
      name,
      kind,
      owner_user_id: user.id,
      created_by: user.id,
      updated_by: user.id
    })
    .select("id, name, kind, owner_user_id")
    .single();

  if (walletError || !wallet) {
    redirectWithMessage("/wallets", "error", walletError?.message ?? "Gagal membuat wallet.");
  }

  const { error: memberError } = await supabase.from("wallet_members").insert({
    wallet_id: wallet.id,
    user_id: user.id,
    role: "owner",
    created_by: user.id,
    updated_by: user.id
  });

  if (memberError) {
    redirectWithMessage("/wallets", "error", memberError.message);
  }

  const starterCategories = getStarterCategories();
  const { data: createdCategories, error: categoryError } = await supabase
    .from("categories")
    .insert(
      starterCategories.map((category) => ({
        wallet_id: wallet.id,
        name: category.name,
        kind: category.kind,
        color: category.color,
        is_system: true,
        created_by: user.id,
        updated_by: user.id
      }))
    )
    .select("id, name, kind");

  if (categoryError || !createdCategories) {
    redirectWithMessage("/wallets", "error", categoryError?.message ?? "Gagal membuat kategori default.");
  }

  const categoryMap = new Map(
    starterCategories.map((category) => {
      const created = createdCategories.find(
        (item) => item.name === category.name && item.kind === category.kind
      );

      return [category.key, created?.id ?? null];
    })
  );

  const starterTemplates = getStarterTemplates(kind, setupPreset);
  const templateRows = starterTemplates
    .map((template) => {
      const categoryId = categoryMap.get(template.categoryKey);

      if (!categoryId) {
        return null;
      }

      return {
        wallet_id: wallet.id,
        category_id: categoryId,
        name: template.name,
        kind: template.kind,
        note: template.note,
        default_amount: template.defaultAmount,
        split_type: template.splitType,
        created_by: user.id,
        updated_by: user.id
      };
    })
    .filter((template): template is NonNullable<typeof template> => Boolean(template));

  if (templateRows.length > 0) {
    const { error: templateError } = await supabase.from("transaction_templates").insert(templateRows);

    if (templateError) {
      redirectWithMessage("/wallets", "error", templateError.message);
    }
  }

  const monthStart = `${getCurrentMonthKey()}-01`;
  const budgetRows = getBudgetPresetRows({
    budgetPreset,
    categoryIdsByKey: categoryMap,
    monthStart
  }).map((budget) => ({
    wallet_id: wallet.id,
    category_id: budget.category_id,
    month_start: budget.month_start,
    amount: budget.amount,
    created_by: user.id,
    updated_by: user.id
  }));

  if (budgetRows.length > 0) {
    const { error: budgetError } = await supabase.from("budgets").insert(budgetRows);

    if (budgetError) {
      redirectWithMessage("/wallets", "error", budgetError.message);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  redirect(`/wallets/${wallet.id}`);
}

export async function createWalletInvitation(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "").trim();
  const invitedEmail = normalizeEmail(String(formData.get("invited_email") ?? ""));
  const role = String(formData.get("role") ?? "viewer").trim() as "editor" | "viewer";
  const redirectPath = membersPath(walletId);
  const { supabase, user } = await requireUser();
  const admin = createAdminClient();

  if (!walletId) {
    redirect(withMessage("/wallets", "error", "Wallet tidak ditemukan."));
  }

  if (!invitedEmail) {
    redirect(withMessage(redirectPath, "error", "Email undangan wajib diisi."));
  }

  if (!["editor", "viewer"].includes(role)) {
    redirect(withMessage(redirectPath, "error", "Peran undangan tidak valid."));
  }

  if (!admin) {
    redirect(withMessage(redirectPath, "error", "SUPABASE_SECRET_KEY wajib diisi agar undangan dapat diproses."));
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    redirect(withMessage(redirectPath, "error", "Profile belum sinkron. Jalankan migrasi 0002 atau isi SUPABASE_SECRET_KEY."));
  }

  const [{ data: membership, error: membershipError }, { data: wallet, error: walletError }, { data: inviterProfile, error: inviterError }] = await Promise.all([
    supabase.from("wallet_members").select("role").eq("wallet_id", walletId).eq("user_id", user.id).maybeSingle(),
    supabase.from("wallets").select("id, name").eq("id", walletId).maybeSingle(),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle()
  ]);

  if (membershipError || membership?.role !== "owner") {
    redirect(withMessage(redirectPath, "error", "Hanya owner wallet yang dapat mengundang anggota."));
  }

  if (walletError || !wallet) {
    redirect(withMessage(redirectPath, "error", walletError?.message ?? "Wallet tidak ditemukan."));
  }

  if (inviterError) {
    redirect(withMessage(redirectPath, "error", inviterError.message));
  }

  if (normalizeEmail(user.email ?? "") === invitedEmail) {
    redirect(withMessage(redirectPath, "error", "Anda sudah menjadi pemilik wallet ini. Tidak perlu mengundang email sendiri."));
  }

  const { data: invitedProfile, error: invitedProfileError } = await admin
    .from("profiles")
    .select("id, email")
    .ilike("email", invitedEmail)
    .maybeSingle();

  if (invitedProfileError) {
    redirect(withMessage(redirectPath, "error", invitedProfileError.message));
  }

  if (invitedProfile?.id) {
    const { data: existingMember, error: existingMemberError } = await admin
      .from("wallet_members")
      .select("id")
      .eq("wallet_id", walletId)
      .eq("user_id", invitedProfile.id)
      .maybeSingle();

    if (existingMemberError) {
      redirect(withMessage(redirectPath, "error", existingMemberError.message));
    }

    if (existingMember) {
      redirect(withMessage(redirectPath, "error", "Email tersebut sudah menjadi anggota wallet."));
    }
  }

  const { data: existingInvitation, error: existingInvitationError } = await supabase
    .from("wallet_invitations")
    .select("id")
    .eq("wallet_id", walletId)
    .ilike("invited_email", invitedEmail)
    .in("status", ["pending", "expired"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingInvitationError) {
    redirect(withMessage(redirectPath, "error", existingInvitationError.message));
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const invitationPayload = {
    wallet_id: walletId,
    invited_email: invitedEmail,
    role,
    token,
    status: "pending" as const,
    invited_by: user.id,
    expires_at: expiresAt,
    created_by: user.id,
    updated_by: user.id
  };

  const invitationResult = existingInvitation
    ? await supabase
        .from("wallet_invitations")
        .update({
          role,
          token,
          status: "pending",
          invited_by: user.id,
          expires_at: expiresAt,
          accepted_by: null,
          updated_by: user.id
        })
        .eq("id", existingInvitation.id)
        .select("id, token, invited_email, role, expires_at")
        .single()
    : await supabase
        .from("wallet_invitations")
        .insert(invitationPayload)
        .select("id, token, invited_email, role, expires_at")
        .single();

  const { data: invitation, error: invitationError } = invitationResult;

  if (invitationError || !invitation) {
    redirect(withMessage(redirectPath, "error", invitationError?.message ?? "Gagal membuat undangan wallet."));
  }

  const headerStore = await headers();
  const inviteUrl = new URL(`/invite/${invitation.token}`, buildOrigin(headerStore)).toString();
  let deliveryMessage = `Undangan berhasil dikirim ke ${invitedEmail}.`;

  try {
    await sendWalletInvitationEmail({
      inviteUrl,
      invitedEmail: invitation.invited_email,
      inviterName: inviterProfile?.full_name || inviterProfile?.email || user.email || "Pemilik wallet",
      role: invitation.role,
      walletName: wallet.name,
      expiresAt: invitation.expires_at
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengirim email undangan.";
    console.error("createWalletInvitation:email-delivery-failed", {
      walletId,
      invitedEmail,
      message
    });
    deliveryMessage = "Undangan berhasil dibuat, tetapi email otomatis belum terkirim. Salin tautan undangan dari daftar undangan aktif.";
  }

  revalidatePath(redirectPath);
  redirect(withMessage(redirectPath, "message", deliveryMessage));
}

export async function acceptWalletInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const { user } = await requireUser();
  const admin = createAdminClient();

  if (!token) {
    redirect(withMessage("/wallets", "error", "Token undangan tidak ditemukan."));
  }

  if (!admin) {
    redirect(withMessage(`/invite/${token}`, "error", "SUPABASE_SECRET_KEY wajib diisi agar undangan dapat diterima."));
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    redirect(withMessage(`/invite/${token}`, "error", "Profile belum sinkron. Jalankan migrasi 0002 atau isi SUPABASE_SECRET_KEY."));
  }

  const { data: invitation, error: invitationError } = await admin
    .from("wallet_invitations")
    .select("id, wallet_id, invited_email, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (invitationError || !invitation) {
    redirect(withMessage(`/invite/${token}`, "error", invitationError?.message ?? "Undangan tidak ditemukan."));
  }

  if (normalizeEmail(user.email ?? "") !== normalizeEmail(invitation.invited_email)) {
    redirect(withMessage(`/invite/${token}`, "error", `Undangan ini hanya bisa diterima oleh ${invitation.invited_email}.`));
  }

  if (invitation.status === "accepted") {
    redirect(withMessage(`/wallets/${invitation.wallet_id}`, "message", "Undangan ini sudah pernah diterima."));
  }

  if (invitation.status === "revoked") {
    redirect(withMessage(`/invite/${token}`, "error", "Undangan ini sudah dibatalkan oleh pemilik wallet."));
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await admin
      .from("wallet_invitations")
      .update({
        status: "expired",
        updated_by: user.id
      })
      .eq("id", invitation.id);

    redirect(withMessage(`/invite/${token}`, "error", "Undangan ini sudah kedaluwarsa."));
  }

  const { data: existingMember, error: existingMemberError } = await admin
    .from("wallet_members")
    .select("id")
    .eq("wallet_id", invitation.wallet_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMemberError) {
    redirect(withMessage(`/invite/${token}`, "error", existingMemberError.message));
  }

  if (!existingMember) {
    const { error: insertMemberError } = await admin.from("wallet_members").insert({
      wallet_id: invitation.wallet_id,
      user_id: user.id,
      role: invitation.role,
      created_by: user.id,
      updated_by: user.id
    });

    if (insertMemberError) {
      redirect(withMessage(`/invite/${token}`, "error", insertMemberError.message));
    }
  }

  const { error: acceptError } = await admin
    .from("wallet_invitations")
    .update({
      status: "accepted",
      accepted_by: user.id,
      updated_by: user.id
    })
    .eq("id", invitation.id);

  if (acceptError) {
    redirect(withMessage(`/invite/${token}`, "error", acceptError.message));
  }

  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  revalidatePath(membersPath(invitation.wallet_id));
  redirect(withMessage(`/wallets/${invitation.wallet_id}`, "message", "Undangan berhasil diterima."));
}
