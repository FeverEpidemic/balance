import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/chat-auth";
import { applyRateLimitHeaders, consumeChatApiRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import { dateStringToISO, isValidDateString } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const auth = await verifyApiKey(authHeader);

  if (!auth) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rateLimit = await consumeChatApiRateLimit(auth.keyId);

  if (!rateLimit.allowed) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "rate_limited" }, { status: 429 }),
      rateLimit
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const walletId = typeof body.wallet_id === "string" ? body.wallet_id : null;
  const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : null;
  const kind = body.kind === "income" || body.kind === "expense" ? body.kind : null;

  if (!walletId || !amount || !kind) {
    return NextResponse.json({ error: "wallet_id, amount, and kind are required" }, { status: 400 });
  }

  const categoryId = typeof body.category_id === "string" ? body.category_id : null;
  const note = typeof body.note === "string" && body.note.length > 0 ? body.note : null;
  const happenedAt = typeof body.happened_at === "string" && isValidDateString(body.happened_at) ? body.happened_at : new Date().toISOString().slice(0, 10);
  const happenedAtISO = dateStringToISO(happenedAt);

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // Verify wallet membership and reject viewers
  const { data: membership, error: membershipError } = await admin
    .from("wallet_members")
    .select("role")
    .eq("wallet_id", walletId)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json({ error: "not_a_member" }, { status: 403 });
  }

  if (membership.role === "viewer") {
    return NextResponse.json({ error: "viewer_cannot_write" }, { status: 403 });
  }

  const { data: transaction, error: insertError } = await admin
    .from("transactions")
    .insert({
      wallet_id: walletId,
      category_id: categoryId,
      kind,
      amount,
      note,
      happened_at: happenedAtISO,
      source: "manual" as const,
      created_by: auth.userId,
      updated_by: auth.userId
    })
    .select("id")
    .single();

  if (insertError || !transaction) {
    return NextResponse.json({ error: insertError?.message || "insert_failed" }, { status: 500 });
  }

  // Invalidate caches and revalidate paths
  const { data: memberIds } = await admin
    .from("wallet_members")
    .select("user_id")
    .eq("wallet_id", walletId);

  const dashboardUserIds = memberIds ? [...new Set(memberIds.map((m) => m.user_id))] : [];

  await invalidateWalletReadCaches(walletId, {
    targets: ["overview", "transactions", "budgets"],
    dashboardUserIds
  });

  return applyRateLimitHeaders(
    NextResponse.json({
      id: transaction.id,
      wallet_id: walletId,
      kind,
      amount,
      happened_at: happenedAtISO,
      source: "manual"
    }),
    rateLimit
  );
}
