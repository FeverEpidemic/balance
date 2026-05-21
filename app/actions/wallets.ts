"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ensureProfileForUser } from "@/lib/profile";

const defaultCategories = [
  { name: "Pemasukan", kind: "income", color: "#5b8f62" },
  { name: "Makanan", kind: "expense", color: "#595f3d" },
  { name: "Transport", kind: "expense", color: "#555f4e" },
  { name: "Tagihan", kind: "expense", color: "#717854" },
  { name: "Belanja", kind: "expense", color: "#8a9170" },
  { name: "Hiburan", kind: "expense", color: "#909579" }
] as const;

function withMessage(path: string, type: "error" | "message", message: string) {
  return `${path}?${new URLSearchParams({ [type]: message }).toString()}`;
}

export async function createWallet(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const kind = String(formData.get("kind") ?? "personal");
  const { supabase, user } = await requireUser();
  const profile = await ensureProfileForUser(user);

  if (!profile) {
    redirect(withMessage("/wallets", "error", "Profile belum sinkron. Jalankan migrasi 0002 atau isi SUPABASE_SERVICE_ROLE_KEY."));
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

  const { error: categoryError } = await supabase.from("categories").insert(
    defaultCategories.map((category) => ({
      wallet_id: wallet.id,
      name: category.name,
      kind: category.kind,
      color: category.color,
      is_system: true,
      created_by: user.id,
      updated_by: user.id
    }))
  );

  if (categoryError) {
    redirect(withMessage("/wallets", "error", categoryError.message));
  }

  revalidatePath("/dashboard");
  revalidatePath("/wallets");
  redirect(`/wallets/${wallet.id}`);
}
