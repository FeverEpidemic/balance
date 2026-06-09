import { createElement } from "react";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getWalletBundle } from "@/lib/data";
import { queryCurrentUserWalletIds } from "@/lib/data/queries";
import { getSiteUrl } from "@/lib/env";
import { defaultLocale, localizePath, resolveLocale } from "@/lib/i18n";
import { buildReportPdfData, ReportDocument } from "@/lib/pdf";
import { createClient } from "@/lib/supabase/server";
import { toFileSafeSegment } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ walletId: string }> }) {
  const { walletId } = await context.params;
  const locale = resolveLocale(request.nextUrl.searchParams.get("locale") ?? defaultLocale);
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(localizePath(locale, "/login"), getSiteUrl()));
  }

  const memberships = await queryCurrentUserWalletIds(user.id);

  if (!memberships.some((membership) => membership.wallet_id === walletId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const bundle = await getWalletBundle(user.id, walletId);

  if (!bundle) {
    return NextResponse.json({ message: "Wallet not found" }, { status: 404 });
  }

  const data = buildReportPdfData(bundle, locale);
  const document = createElement(ReportDocument, { data }) as Parameters<typeof renderToBuffer>[0];
  const buffer = await renderToBuffer(document);
  const fileName = `report-${toFileSafeSegment(bundle.wallet.name)}-${data.period.monthKey}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
