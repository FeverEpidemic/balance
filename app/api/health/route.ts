import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;

  const admin = createAdminClient();
  if (admin) {
    const { error } = await admin.from("wallets").select("id", { count: "exactly", head: true }).limit(1);
    dbOk = !error;
  }

  const healthy = dbOk;
  const statusCode = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}
