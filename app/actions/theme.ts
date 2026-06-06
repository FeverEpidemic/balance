"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth";
import { invalidateSettingsCache } from "@/lib/data/cache";
import { errorResult, getTrimmedValue, successResult, type ActionResult } from "@/app/actions/_shared";
import { THEME_COOKIE_NAME, isThemePreference } from "@/lib/theme";

export async function updateThemePreference(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const preference = getTrimmedValue(formData, "theme_preference");
  const { supabase, user } = await requireUser();

  if (!isThemePreference(preference)) {
    return errorResult("Pilihan tema tidak valid.");
  }

  const { error } = await supabase.from("profiles").update({ theme_preference: preference }).eq("id", user.id);

  if (error) {
    return errorResult(error.message);
  }

  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, preference, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  await invalidateSettingsCache(user.id);
  revalidatePath("/settings");
  revalidatePath("/", "layout");

  return successResult("Tema aplikasi berhasil diperbarui.");
}
