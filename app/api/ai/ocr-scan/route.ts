import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getVisionClient, getVisionModelName, isVisionAvailable } from "@/lib/ai/vision-client";
import { OCR_SYSTEM_PROMPT, parseOcrResponse, type OcrTransactionResult } from "@/lib/ai/ocr-prompt";
import { getPlanPolicy } from "@/lib/plan";
import { consumeOcrDailyLimit, consumeOcrRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const OCR_RATE_LIMIT_WINDOW = 10; // 1 scan per 10 seconds

export async function POST(request: Request) {
  const startTime = Date.now();
  let imageBase64 = "";

  try {
    // 1. Auth
    const { user } = await requireUser();
    const userId = user.id;

    // 2. Check feature availability
    if (!isVisionAvailable()) {
      return NextResponse.json(
        { ok: false, error: "Fitur scan struk sedang tidak tersedia." },
        { status: 503 }
      );
    }

    // 3. Plan check (daily limit)
    const planPolicy = await getPlanPolicy(userId);
    const dailyLimit = planPolicy.ocrScanDailyLimit;

    if (dailyLimit !== null && dailyLimit !== Infinity) {
      const dailyResult = await consumeOcrDailyLimit(userId, dailyLimit);
      if (!dailyResult.allowed) {
        console.log(
          `[ocr-scan] status=limit_hit user=${userId} duration=${Date.now() - startTime}ms`
        );
        return NextResponse.json(
          { ok: false, error: "Kamu sudah mencapai batas scan hari ini. Upgrade ke Premium untuk limit lebih tinggi." },
          { status: 429 }
        );
      }
    }

    // 4. Per-minute rate limit (abuse prevention)
    const rateResult = await consumeOcrRateLimit(userId);
    if (!rateResult.allowed) {
      const retryAfter = Math.max(0, Math.ceil((rateResult.resetAt - Date.now()) / 1000));
      console.log(
        `[ocr-scan] status=rate_limited user=${userId} duration=${Date.now() - startTime}ms`
      );
      return NextResponse.json(
        { ok: false, error: "Terlalu cepat. Tunggu beberapa detik sebelum scan lagi." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // 5. Parse image from request
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file) {
        return NextResponse.json(
          { ok: false, error: "Tidak ada gambar yang ditemukan." },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          { ok: false, error: "Gambar terlalu besar (maks 5 MB)." },
          { status: 400 }
        );
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      imageBase64 = buffer.toString("base64");
    } else if (contentType.includes("application/json")) {
      const body = (await request.json()) as { image?: string };
      const raw = body.image ?? "";
      const dataUrlMatch = raw.match(/^data:image\/[^;]+;base64,(.+)$/);
      imageBase64 = dataUrlMatch ? dataUrlMatch[1] : raw;
      if (!imageBase64) {
        return NextResponse.json(
          { ok: false, error: "Tidak ada data gambar." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Content type tidak didukung. Gunakan multipart/form-data atau application/json." },
        { status: 400 }
      );
    }

    // 6. Call vision model
    const client = getVisionClient()!;
    const model = getVisionModelName();
    const dataUrl = `data:image/jpeg;base64,${imageBase64}`;

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        { role: "system", content: OCR_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url" as const,
              image_url: { url: dataUrl, detail: "auto" },
            },
          ],
        },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content?.trim() ?? "";
    const parsed = parseOcrResponse(rawResponse);

    // Clear image data from memory
    imageBase64 = "";

    if (!parsed || !parsed.amount || parsed.amount <= 0) {
      console.log(
        `[ocr-scan] status=failed user=${userId} duration=${Date.now() - startTime}ms`
      );
      return NextResponse.json(
        { ok: false, error: "Tidak bisa membaca struk. Coba foto dengan pencahayaan lebih baik dan pastikan teks terlihat jelas." },
        { status: 422 }
      );
    }

    console.log(
      `[ocr-scan] status=success user=${userId} duration=${Date.now() - startTime}ms amount=${parsed.amount}`
    );

    return NextResponse.json({
      ok: true,
      result: parsed satisfies OcrTransactionResult,
    });
  } catch (error: unknown) {
    // Ensure image data is cleared on error too
    imageBase64 = "";

    const message = (error as Error)?.message ?? String(error);
    console.error(`[ocr-scan] Error: ${message}`);
    return NextResponse.json(
      { ok: false, error: "Gagal memindai. Coba lagi." },
      { status: 500 }
    );
  }
}
