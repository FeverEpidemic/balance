"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ensureProfileForUser } from "@/lib/profile";
import { getCurrentMonthKey } from "@/lib/finance";
import { getBudgetPresetRows, getStarterCategories, getStarterTemplates, type BudgetPreset, type WalletSetupPreset } from "@/lib/wallet-starter-templates";

function withMessage(path: string, type: "error" | "message", message: string) {
  return `${path}?${new URLSearchParams({ [type]: message }).toString()}`;
}

export async function createWallet(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "personal") as "personal" | "shared";
  const setupPreset = String(formData.get("setup_preset") ?? "standard") as WalletSetupPreset;
  const budgetPreset = String(formData.get("budget_preset") ?? "balanced") as BudgetPreset;
  const { supabase, user } = await requireUser();
  const profile = await ensureProfileForUser(user);

  if (!profile) {
    redirect(withMessage("/wallets", "error", "Profile belum sinkron. Jalankan migrasi 0002 atau isi SUPABASE_SECRET_KEY."));
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
    redirect(withMessage("/wallets", "error", walletError?.message ?? "Gagal membuat wallet."));
  }

  const { error: memberError } = await supabase.from("wallet_members").insert({
    wallet_id: wallet.id,
    user_id: user.id,
    role: "owner",
    created_by: user.id,
    updated_by: user.id
  });

  if (memberError) {
    redirect(withMessage("/wallets", "error", memberError.message));
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
    redirect(withMessage("/wallets", "error", categoryError?.message ?? "Gagal membuat kategori default."));
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
      redirect(withMessage("/wallets", "error", templateError.message));
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
      redirect(withMessage("/wallets", "error", budgetError.message));
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  redirect(`/wallets/${wallet.id}`);
}
