import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, getPeriodRange, type RekapPeriod } from "@/lib/chat-auth";
import { applyRateLimitHeaders, consumeChatApiRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TransactionKind, TransactionRow } from "@/lib/data/types";

type RekapResponse = {
  period: RekapPeriod;
  range: { start: string; end: string };
  wallets: string[];
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  categoryBreakdown: Array<{ categoryId: string | null; categoryName: string; total: number }>;
  perWallet: Array<{ walletId: string; walletName: string; totalIncome: number; totalExpense: number; net: number; transactionCount: number }>;
};

export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") ?? "month";
  let period: RekapPeriod = "month";

  if (periodParam === "day" || periodParam === "week" || periodParam === "month") {
    period = periodParam;
  }

  const walletId = searchParams.get("wallet_id") ?? null;
  const range = getPeriodRange(period);

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // Get user membership context
  const { data: memberships, error: membershipError } = await admin
    .from("wallet_members")
    .select("wallet_id, role")
    .eq("user_id", auth.userId);

  if (membershipError || !memberships || memberships.length === 0) {
    return NextResponse.json({ error: "no_wallets" }, { status: 404 });
  }

  const memberWalletIds = memberships.map((m) => m.wallet_id);

  // If a specific wallet_id was requested, verify membership
  let targetWalletIds: string[];
  if (walletId) {
    if (!memberWalletIds.includes(walletId)) {
      return NextResponse.json({ error: "not_a_member" }, { status: 403 });
    }
    targetWalletIds = [walletId];
  } else {
    targetWalletIds = memberWalletIds;
  }

  // Fetch transactions in the period range
  const startAt = `${range.start.slice(0, 10)}T00:00:00.000Z`;
  const endAt = `${range.end.slice(0, 10)}T23:59:59.999Z`;

  const { data: transactions, error: txError } = await admin
    .from("transactions")
    .select("id, wallet_id, category_id, kind, amount, happened_at, note, source")
    .in("wallet_id", targetWalletIds)
    .gte("happened_at", startAt)
    .lte("happened_at", endAt)
    .order("happened_at", { ascending: false });

  if (txError) {
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const txRows = (transactions ?? []) as Pick<TransactionRow, "id" | "wallet_id" | "category_id" | "kind" | "amount" | "happened_at">[];

  // Fetch categories for breakdown
  const { data: categories } = await admin
    .from("categories")
    .select("id, wallet_id, name, kind")
    .in("wallet_id", targetWalletIds);

  const categoryMap = new Map<string, { name: string; kind: TransactionKind }>();
  (categories ?? []).forEach((c) => {
    categoryMap.set(c.id, { name: c.name, kind: c.kind });
  });

  // Fetch wallet names
  const { data: wallets } = await admin
    .from("wallets")
    .select("id, name")
    .in("id", targetWalletIds);

  const walletNameMap = new Map<string, string>();
  (wallets ?? []).forEach((w) => {
    walletNameMap.set(w.id, w.name);
  });

  // Compute aggregates
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = new Map<string, { categoryName: string; total: number }>();
  const walletAgg = new Map<string, { totalIncome: number; totalExpense: number; transactionCount: number }>();

  // Initialize wallet aggregates
  targetWalletIds.forEach((wid) => {
    walletAgg.set(wid, { totalIncome: 0, totalExpense: 0, transactionCount: 0 });
  });

  txRows.forEach((tx) => {
    if (tx.kind === "income") {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }

    // Category breakdown (expense only)
    if (tx.kind === "expense" && tx.category_id) {
      const cat = categoryMap.get(tx.category_id);
      const catName = cat?.name ?? "Tanpa Kategori";
      const existing = categoryTotals.get(tx.category_id);
      if (existing) {
        existing.total += tx.amount;
      } else {
        categoryTotals.set(tx.category_id, { categoryName: catName, total: tx.amount });
      }
    }

    // Per-wallet aggregation
    const wa = walletAgg.get(tx.wallet_id);
    if (wa) {
      wa.transactionCount += 1;
      if (tx.kind === "income") {
        wa.totalIncome += tx.amount;
      } else {
        wa.totalExpense += tx.amount;
      }
    }
  });

  const categoryBreakdown = Array.from(categoryTotals.entries())
    .map(([categoryId, { categoryName, total }]) => ({
      categoryId,
      categoryName,
      total
    }))
    .sort((a, b) => b.total - a.total);

  const perWallet = Array.from(walletAgg.entries())
    .map(([walletId, agg]) => ({
      walletId,
      walletName: walletNameMap.get(walletId) ?? "Unknown",
      totalIncome: agg.totalIncome,
      totalExpense: agg.totalExpense,
      net: agg.totalIncome - agg.totalExpense,
      transactionCount: agg.transactionCount
    }))
    .sort((a, b) => b.transactionCount - a.transactionCount);

  const response: RekapResponse = {
    period,
    range: { start: range.start, end: range.end },
    wallets: targetWalletIds,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    transactionCount: txRows.length,
    categoryBreakdown,
    perWallet
  };

  return applyRateLimitHeaders(NextResponse.json(response), rateLimit);
}
