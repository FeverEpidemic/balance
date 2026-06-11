"use server";

import { requireUser } from "@/lib/auth";
import { DEFAULT_CATEGORY_COLOR, isSystemManagedCategory, isValidCategoryColor, isValidCategoryKind, normalizeCategoryName } from "@/lib/categories";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import type { CategoryRow } from "@/lib/data/types";
import {
  errorResult,
  getActionTranslator,
  getWalletMemberUserIds,
  getStringValue,
  getTrimmedValue,
  revalidateWalletPaths,
  safeDbError,
  successResult,
  type ActionResult
} from "@/app/actions/_shared";

function readCategoryForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    categoryId: getStringValue(formData, "category_id"),
    name: normalizeCategoryName(getTrimmedValue(formData, "name")),
    kind: getStringValue(formData, "kind"),
    color: getTrimmedValue(formData, "color") || DEFAULT_CATEGORY_COLOR
  };
}

async function findDuplicateCategory(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  args: {
    walletId: string;
    kind: "income" | "expense";
    name: string;
    excludeCategoryId?: string;
  }
) {
  let query = supabase
    .from("categories")
    .select("id")
    .eq("wallet_id", args.walletId)
    .eq("kind", args.kind)
    .ilike("name", args.name)
    .limit(1);

  if (args.excludeCategoryId) {
    query = query.neq("id", args.excludeCategoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).length > 0;
}

async function getEditableCategory(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string,
  categoryId: string
) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, wallet_id, name, kind, color, is_system")
    .eq("id", categoryId)
    .eq("wallet_id", walletId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CategoryRow;
}

function validateCategoryInput(
  t: Awaited<ReturnType<typeof getActionTranslator>>,
  input: {
    name: string;
    kind: string;
    color: string;
  }
) {
  if (!input.name) {
    return t("actionErrors.categoryNameRequired");
  }

  if (!isValidCategoryKind(input.kind)) {
    return t("actionErrors.referenceNotFound");
  }

  if (!isValidCategoryColor(input.color)) {
    return t("actionErrors.referenceNotFound");
  }

  return null;
}

async function refreshCategorySurfaces(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  walletId: string
) {
  const dashboardUserIds = await getWalletMemberUserIds(supabase, walletId);

  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "transactions", "budgets", "categories", "recurring"],
    dashboardUserIds
  });
  await revalidateWalletPaths(walletId, {
    includeDashboard: true,
    includeOverview: true,
    sections: ["categories", "transactions", "budgets", "recurring", "reports", "templates"]
  });
}

export async function createCategory(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, name, kind, color } = readCategoryForm(formData);
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  const validationError = validateCategoryInput(t, { name, kind, color });

  if (validationError) {
    return errorResult(validationError);
  }

  if (!isValidCategoryKind(kind)) {
    return errorResult(t("actionErrors.referenceNotFound"));
  }

  const parsedKind = kind;

  if (await findDuplicateCategory(supabase, { walletId, kind: parsedKind, name })) {
    return errorResult(t("actionErrors.categoryNameDuplicate"));
  }

  const { error } = await supabase.from("categories").insert({
    wallet_id: walletId,
    name,
    kind: parsedKind,
    color,
    is_system: false,
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  await refreshCategorySurfaces(supabase, walletId);
  return successResult(t("actionSuccess.categorySaved"), { resetForm: true });
}

export async function updateCategory(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, categoryId, name, kind, color } = readCategoryForm(formData);
  const { supabase, user } = await requireUser();
  const t = await getActionTranslator();

  if (!categoryId) {
    return errorResult(t("actionErrors.categoryNotFound"));
  }

  const validationError = validateCategoryInput(t, { name, kind, color });

  if (validationError) {
    return errorResult(validationError);
  }

  if (!isValidCategoryKind(kind)) {
    return errorResult(t("actionErrors.referenceNotFound"));
  }

  const parsedKind = kind;

  const existingCategory = await getEditableCategory(supabase, walletId, categoryId);

  if (!existingCategory) {
    return errorResult(t("actionErrors.categoryNotFound"));
  }

  if (isSystemManagedCategory(existingCategory)) {
    return errorResult(t("actionErrors.categoryDeleteSystemWarning"));
  }

  if (await findDuplicateCategory(supabase, { walletId, kind: parsedKind, name, excludeCategoryId: categoryId })) {
    return errorResult(t("actionErrors.categoryNameDuplicate"));
  }

  const changes: Partial<Pick<CategoryRow, "name" | "kind" | "color">> & { updated_by?: string } = {};

  if (existingCategory.name !== name) {
    changes.name = name;
  }

  if (existingCategory.kind !== parsedKind) {
    changes.kind = parsedKind;
  }

  if (existingCategory.color.toLowerCase() !== color.toLowerCase()) {
    changes.color = color;
  }

  if (Object.keys(changes).length === 0) {
    return successResult(t("actionSuccess.categoryUpdated"));
  }

  changes.updated_by = user.id;

  const { error } = await supabase.from("categories").update(changes).eq("id", categoryId).eq("wallet_id", walletId);

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  await refreshCategorySurfaces(supabase, walletId);
  return successResult(t("actionSuccess.categoryUpdated"));
}

export async function deleteCategory(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { walletId, categoryId } = readCategoryForm(formData);
  const { supabase } = await requireUser();
  const t = await getActionTranslator();

  if (!categoryId) {
    return errorResult(t("actionErrors.categoryNotFound"));
  }

  const existingCategory = await getEditableCategory(supabase, walletId, categoryId);

  if (!existingCategory) {
    return errorResult(t("actionErrors.categoryNotFound"));
  }

  if (isSystemManagedCategory(existingCategory)) {
    return errorResult(t("actionErrors.categoryDeleteSystemWarning"));
  }

  const { error } = await supabase.from("categories").delete().eq("id", categoryId).eq("wallet_id", walletId);

  if (error) {
    return errorResult(safeDbError(error, "actionErrors.unexpectedError", t));
  }

  await refreshCategorySurfaces(supabase, walletId);
  return successResult(t("actionSuccess.categoryDeleted"));
}
