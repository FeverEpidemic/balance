import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

  if (!publicKey) {
    return NextResponse.json(
      { ok: false, error: "VAPID public key not configured" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, publicKey });
}
