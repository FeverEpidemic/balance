import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { defaultLocale, LOCALE_COOKIE_NAME, localizePath, resolveLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    const cookieStore = await cookies();
    const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? defaultLocale);
    redirect(localizePath(locale, "/login"));
  }

  return { supabase, user };
}

export function getUserDisplayName(user: User, fullName?: string | null) {
  return fullName || user.user_metadata.full_name || user.user_metadata.name || user.email || "Pengguna";
}
