"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ensureProfileForUser } from "@/lib/profile";
import { invalidateDashboardCache, invalidateWalletReadCaches } from "@/lib/data/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMonthKey } from "@/lib/finance";
import { getBudgetPresetRows, getStarterCategories, getStarterTemplates, type BudgetPreset, type WalletSetupPreset } from "@/lib/wallet-starter-templates";
import {
  MAX_WALLET_MEMBERS,
  WALLET_ACCEPT_INVITATION_FULL_MESSAGE,
  WALLET_CAPACITY_REACHED_MESSAGE
} from "@/lib/wallet-capacity";
import { getStringValue, getTrimmedValue, redirectWithMessage, withMessage } from "@/app/actions/_shared";

function readWalletForm(formData: FormData) {
  return {
    name: getTrimmedValue(formData, "name"),
    kind: (getStringValue(formData, "kind") || "personal") as "personal" | "shared",
    setupPreset: (getStringValue(formData, "setup_preset") || "standard") as WalletSetupPreset,
    budgetPreset: (getStringValue(formData, "budget_preset") || "balanced") as BudgetPreset
  };
}

function membersPath(walletId: string) {
  return `/wallets/${walletId}/members`;
}

async function getWalletCapacitySnapshot(client: any, walletId: string) {
  const memberQuery = client.from("wallet_members").select("*", { count: "exact", head: true }).eq("wallet_id", walletId);
  const invitationQuery = client
    .from("wallet_invitations")
    .select("*", { count: "exact", head: true })
    .eq("wallet_id", walletId)
    .eq("status", "pending");

  const [memberResult, invitationResult] = await Promise.all([memberQuery, invitationQuery]);

  return {
    memberCount: memberResult.count ?? 0,
    pendingInvitationCount: invitationResult.count ?? 0,
    error: memberResult.error ?? invitationResult.error
  };
}

function isWalletCapacityError(message: string) {
  return message.includes("wallet_member_limit_reached");
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

  await invalidateDashboardCache();
  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  redirect(`/wallets/${wallet.id}`);
}

export async function createWalletInvitation(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer").trim() as "editor" | "viewer";
  const redirectPath = membersPath(walletId);
  const { supabase, user } = await requireUser();

  if (!walletId) {
    redirect(withMessage("/wallets", "error", "Wallet tidak ditemukan."));
  }

  if (!["editor", "viewer"].includes(role)) {
    redirect(withMessage(redirectPath, "error", "Peran undangan tidak valid."));
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    redirect(withMessage(redirectPath, "error", "Profile belum sinkron. Jalankan migrasi 0002 atau isi SUPABASE_SECRET_KEY."));
  }

  const [{ data: membership, error: membershipError }, { data: wallet, error: walletError }] = await Promise.all([
    supabase.from("wallet_members").select("role").eq("wallet_id", walletId).eq("user_id", user.id).maybeSingle(),
    supabase.from("wallets").select("id, name").eq("id", walletId).maybeSingle()
  ]);

  if (membershipError || membership?.role !== "owner") {
    redirect(withMessage(redirectPath, "error", "Hanya owner wallet yang dapat mengundang anggota."));
  }

  if (walletError || !wallet) {
    redirect(withMessage(redirectPath, "error", walletError?.message ?? "Wallet tidak ditemukan."));
  }

  const capacity = await getWalletCapacitySnapshot(supabase, walletId);

  if (capacity.error) {
    redirect(withMessage(redirectPath, "error", capacity.error.message));
  }

  if (capacity.memberCount + capacity.pendingInvitationCount >= MAX_WALLET_MEMBERS) {
    redirect(withMessage(redirectPath, "error", WALLET_CAPACITY_REACHED_MESSAGE));
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
  const invitationPayload = {
    wallet_id: walletId,
    role,
    token,
    status: "pending" as const,
    invited_by: user.id,
    expires_at: expiresAt,
    created_by: user.id,
    updated_by: user.id
  };

  const invitationResult = await supabase
    .from("wallet_invitations")
    .insert(invitationPayload)
    .select("id, token, role, expires_at")
    .single();

  const { data: invitation, error: invitationError } = invitationResult;

  if (invitationError || !invitation) {
    redirect(withMessage(redirectPath, "error", invitationError?.message ?? "Gagal membuat undangan wallet."));
  }

  await invalidateWalletReadCaches(walletId, { includeDashboards: true });
  revalidatePath(redirectPath);
  redirect(withMessage(redirectPath, "message", `Tautan undangan ${invitation.role} berhasil dibuat.`));
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
    .select("id, wallet_id, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (invitationError || !invitation) {
    redirect(withMessage(`/invite/${token}`, "error", invitationError?.message ?? "Undangan tidak ditemukan."));
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
    const capacity = await getWalletCapacitySnapshot(admin, invitation.wallet_id);

    if (capacity.error) {
      redirect(withMessage(`/invite/${token}`, "error", capacity.error.message));
    }

    if (capacity.memberCount + capacity.pendingInvitationCount > MAX_WALLET_MEMBERS) {
      redirect(withMessage(`/invite/${token}`, "error", WALLET_ACCEPT_INVITATION_FULL_MESSAGE));
    }
  }

  const { data: acceptedWalletId, error: acceptError } = await admin.rpc("accept_wallet_invitation_atomic", {
    invitation_token: token,
    accepting_user_id: user.id
  });

  if (acceptError || !acceptedWalletId) {
    const errorMessage = acceptError?.message ?? "Gagal menerima undangan wallet.";
    redirect(withMessage(`/invite/${token}`, "error", isWalletCapacityError(errorMessage) ? WALLET_ACCEPT_INVITATION_FULL_MESSAGE : errorMessage));
  }

  await invalidateWalletReadCaches(acceptedWalletId, { includeDashboards: true });
  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  revalidatePath(membersPath(acceptedWalletId));
  redirect(withMessage(`/wallets/${acceptedWalletId}`, "message", "Undangan berhasil diterima."));
}
