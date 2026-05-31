import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/profile";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureProfileForUser(user);

  return { supabase, user };
}

export function getUserDisplayName(user: User, fullName?: string | null) {
  return fullName || user.user_metadata.full_name || user.user_metadata.name || user.email || "Pengguna";
}
