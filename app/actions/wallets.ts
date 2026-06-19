"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ensureProfileForUser } from "@/lib/profile";
import { invalidateDashboardCache } from "@/lib/data/cache";
import { localizePath, translate } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentMonthKey } from "@/lib/finance";
import { getBudgetPresetRows, getStarterCategories, getStarterTemplates, type BudgetPreset, type WalletSetupPreset } from "@/lib/wallet-starter-templates";
import { isFeatureAvailable } from "@/lib/features";
import { getPlanPolicy } from "@/lib/plan";
import {
  MAX_WALLET_MEMBERS,
  getWalletAcceptInvitationFullMessage,
  getWalletCapacityReachedMessage
} from "@/lib/wallet-capacity";
import { getActionLocale, getLocalizedPath, getStringValue, getTrimmedValue, getWalletMemberUserIds, redirectWithMessage, withMessage } from "@/app/actions/_shared";

function readWalletForm(formData: FormData) {
  return {
    name: getTrimmedValue(formData, "name"),
    kind: (getStringValue(formData, "kind") || "personal") as "personal" | "shared",
    currency: getStringValue(formData, "currency") || "IDR",
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
  const { name, kind, currency: formCurrency, setupPreset, budgetPreset } = readWalletForm(formData);
  const { supabase, user } = await requireUser();
  const profile = await ensureProfileForUser(user);
  const locale = await getActionLocale();

  if (!profile) {
    return await redirectWithMessage("/dashboard", "error", translate(locale, "actionErrors.profileNotSynced"));
  }

  // Gate shared wallet behind premium plan (free-tier SaaS only; self-hosted bypasses).
  if (kind === "shared") {
    const planPolicy = await getPlanPolicy(user.id);
    if (!isFeatureAvailable(planPolicy.planType, "shared_wallets")) {
      return await redirectWithMessage("/dashboard", "error", translate(locale, "settings.sharedWalletPremiumOnly"));
    }
  }

  const currency = formCurrency || profile.default_currency || "IDR";

  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .insert({
      name,
      kind,
      currency,
      owner_user_id: user.id,
      created_by: user.id,
      updated_by: user.id
    })
    .select("id, name, kind, owner_user_id, currency")
    .single();

  if (walletError || !wallet) {
    return await redirectWithMessage("/dashboard", "error", translate(locale, "actionErrors.walletCreateFailed"));
  }

  const { error: memberError } = await supabase.from("wallet_members").insert({
    wallet_id: wallet.id,
    user_id: user.id,
    role: "owner",
    created_by: user.id,
    updated_by: user.id
  });

  if (memberError) {
    return await redirectWithMessage("/dashboard", "error", translate(locale, "actionErrors.unexpectedError"));
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
    return await redirectWithMessage("/dashboard", "error", translate(locale, "actionErrors.defaultCategoriesCreateFailed"));
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
      return await redirectWithMessage("/dashboard", "error", translate(locale, "actionErrors.unexpectedError"));
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
      return await redirectWithMessage("/dashboard", "error", translate(locale, "actionErrors.unexpectedError"));
    }
  }

  await invalidateDashboardCache([user.id]);
  revalidatePath(localizePath(locale, "/dashboard"));
  
  redirect(localizePath(locale, `/wallets/${wallet.id}`));
}

export async function createWalletInvitation(formData: FormData) {
  const walletId = String(formData.get("wallet_id") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer").trim() as "editor" | "viewer";
  const redirectPath = membersPath(walletId);
  const { supabase, user } = await requireUser();
  const localizedWalletsPath = await getLocalizedPath("/dashboard");
  const localizedRedirectPath = await getLocalizedPath(redirectPath);
  const locale = await getActionLocale();

  if (!walletId) {
    redirect(withMessage(localizedWalletsPath, "error", translate(locale, "actionErrors.walletNotFound")));
  }

  if (!["editor", "viewer"].includes(role)) {
    redirect(withMessage(localizedRedirectPath, "error", translate(locale, "actionErrors.invalidInviteRole")));
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    redirect(withMessage(localizedRedirectPath, "error", translate(locale, "actionErrors.profileNotSynced")));
  }

  const [{ data: membership, error: membershipError }, { data: wallet, error: walletError }] = await Promise.all([
    supabase.from("wallet_members").select("role").eq("wallet_id", walletId).eq("user_id", user.id).maybeSingle(),
    supabase.from("wallets").select("id, name").eq("id", walletId).maybeSingle()
  ]);

  if (membershipError || membership?.role !== "owner") {
    redirect(withMessage(localizedRedirectPath, "error", translate(locale, "actionErrors.inviteOwnerOnly")));
  }

  if (walletError || !wallet) {
    redirect(withMessage(localizedRedirectPath, "error", translate(locale, "actionErrors.walletNotFound")));
  }

  const capacity = await getWalletCapacitySnapshot(supabase, walletId);

  if (capacity.error) {
    redirect(withMessage(localizedRedirectPath, "error", translate(locale, "actionErrors.unexpectedError")));
  }

  if (capacity.memberCount + capacity.pendingInvitationCount >= MAX_WALLET_MEMBERS) {
    redirect(withMessage(localizedRedirectPath, "error", getWalletCapacityReachedMessage(locale)));
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
    redirect(withMessage(localizedRedirectPath, "error", translate(locale, "actionErrors.walletInvitationCreateFailed")));
  }

  revalidatePath(localizedRedirectPath);
  redirect(withMessage(localizedRedirectPath, "message", translate(locale, "actionSuccess.walletInvitationCreated", {
    role: translate(locale, `members.role${invitation.role.charAt(0).toUpperCase()}${invitation.role.slice(1)}`)
  })));
}

export async function acceptWalletInvitation(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const { user } = await requireUser();
  const admin = createAdminClient();
  const invitePath = await getLocalizedPath(`/invite/${token}`);
  const walletsPath = await getLocalizedPath("/dashboard");
  const locale = await getActionLocale();

  if (!token) {
    redirect(withMessage(walletsPath, "error", translate(locale, "actionErrors.inviteTokenMissing")));
  }

  if (!admin) {
    redirect(withMessage(invitePath, "error", translate(locale, "actionErrors.inviteSecretMissing")));
  }

  const profile = await ensureProfileForUser(user);

  if (!profile) {
    redirect(withMessage(invitePath, "error", translate(locale, "actionErrors.profileNotSynced")));
  }

  const { data: invitation, error: invitationError } = await admin
    .from("wallet_invitations")
    .select("id, wallet_id, role, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (invitationError || !invitation) {
    redirect(withMessage(invitePath, "error", translate(locale, "actionErrors.inviteNotFound")));
  }

  if (invitation.status === "accepted") {
    redirect(withMessage(await getLocalizedPath(`/wallets/${invitation.wallet_id}`), "message", translate(locale, "actionErrors.inviteAlreadyAccepted")));
  }

  if (invitation.status === "revoked") {
    redirect(withMessage(invitePath, "error", translate(locale, "actionErrors.inviteRevoked")));
  }

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await admin
      .from("wallet_invitations")
      .update({
        status: "expired",
        updated_by: user.id
      })
      .eq("id", invitation.id);

    redirect(withMessage(invitePath, "error", translate(locale, "actionErrors.inviteExpired")));
  }

  const { data: existingMember, error: existingMemberError } = await admin
    .from("wallet_members")
    .select("id")
    .eq("wallet_id", invitation.wallet_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMemberError) {
    redirect(withMessage(invitePath, "error", translate(locale, "actionErrors.unexpectedError")));
  }

  if (!existingMember) {
    const capacity = await getWalletCapacitySnapshot(admin, invitation.wallet_id);

    if (capacity.error) {
      redirect(withMessage(invitePath, "error", translate(locale, "actionErrors.unexpectedError")));
    }

    if (capacity.memberCount + capacity.pendingInvitationCount > MAX_WALLET_MEMBERS) {
      redirect(withMessage(invitePath, "error", getWalletAcceptInvitationFullMessage(locale)));
    }
  }

  const { data: acceptedWalletId, error: acceptError } = await admin.rpc("accept_wallet_invitation_atomic", {
    invitation_token: token,
    accepting_user_id: user.id
  });

  if (acceptError || !acceptedWalletId) {
    const rawMessage = acceptError?.message ?? "";
    if (isWalletCapacityError(rawMessage)) {
      redirect(withMessage(invitePath, "error", getWalletAcceptInvitationFullMessage(locale)));
    }
    redirect(withMessage(invitePath, "error", translate(locale, "actionErrors.walletInvitationAcceptFailed")));
  }

  const dashboardUserIds = await getWalletMemberUserIds(admin, acceptedWalletId);
  await invalidateDashboardCache(dashboardUserIds);
  revalidatePath(localizePath(locale, "/dashboard"));
  
  revalidatePath(await getLocalizedPath(membersPath(acceptedWalletId)));
  redirect(withMessage(await getLocalizedPath(`/wallets/${acceptedWalletId}`), "message", translate(locale, "actionSuccess.walletInvitationAccepted")));
}
