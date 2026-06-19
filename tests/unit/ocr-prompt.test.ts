import { describe, expect, it } from "vitest";
import { parseOcrResponse, CATEGORY_SYNONYMS, resolveCategory, type OcrTransactionResult } from "@/lib/ai/ocr-prompt";

describe("parseOcrResponse", () => {
  it("parses valid JSON from the vision model", () => {
    const raw = JSON.stringify({
      amount: 38200,
      category: "Belanja Harian",
      date: "2026-06-18",
      note: "MIDI REGULER D - rokok & air mineral",
      kind: "expense",
      merchant: "MIDI REGULER D",
      paymentMethod: "QRIS",
    });

    const result = parseOcrResponse(raw);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(38200);
    expect(result!.category).toBe("Belanja Harian");
    expect(result!.date).toBe("2026-06-18");
    expect(result!.note).toBe("MIDI REGULER D - rokok & air mineral");
    expect(result!.kind).toBe("expense");
    expect(result!.merchant).toBe("MIDI REGULER D");
    expect(result!.paymentMethod).toBe("QRIS");
  });

  it("strips markdown code fences from the response", () => {
    const raw = `\`\`\`json
{"amount": 15000, "category": "Kopi & Nongkrong", "date": "2026-06-19", "note": "Kopi susu", "kind": "expense", "merchant": "Kopita", "paymentMethod": "QRIS"}
\`\`\``;

    const result = parseOcrResponse(raw);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(15000);
    expect(result!.category).toBe("Kopi & Nongkrong");
  });

  it("handles income transactions", () => {
    const raw = JSON.stringify({
      amount: 5000000,
      category: "Lainnya",
      date: "2026-06-01",
      note: "Gaji bulan Juni",
      kind: "income",
      merchant: "Perusahaan PT",
      paymentMethod: "Transfer",
    });

    const result = parseOcrResponse(raw);

    expect(result).not.toBeNull();
    expect(result!.kind).toBe("income");
    expect(result!.amount).toBe(5000000);
  });

  it("strips 'Rp' and dots from amount in raw text before JSON (edge case)", () => {
    // Some models might return text before/after JSON
    const raw = `Here is the extracted data:
${JSON.stringify({ amount: 38200, category: "Makanan", date: "2026-06-18", note: "Nasi goreng", kind: "expense", merchant: "Warung Java", paymentMethod: "Tunai" })}
Hope this helps!`;

    const result = parseOcrResponse(raw);

    expect(result).not.toBeNull();
    expect(result!.amount).toBe(38200);
    expect(result!.category).toBe("Makanan");
  });

  it("returns null for malformed JSON", () => {
    const raw = "This is not JSON at all";
    const result = parseOcrResponse(raw);
    expect(result).toBeNull();
  });

  it("returns null for empty response", () => {
    expect(parseOcrResponse("")).toBeNull();
    expect(parseOcrResponse("   ")).toBeNull();
  });

  it("returns null when amount is missing or zero", () => {
    const raw = JSON.stringify({
      category: "Makanan",
      date: "2026-06-18",
      note: "Test",
      kind: "expense",
    });

    const result = parseOcrResponse(raw);
    expect(result).toBeNull();
  });
});

describe("resolveCategory", () => {
  it("matches exact category (case insensitive)", () => {
    expect(resolveCategory("Makanan")).toBe("Makanan");
    expect(resolveCategory("makanan")).toBe("Makanan");
    expect(resolveCategory("BELANJA HARIAN")).toBe("Belanja Harian");
  });

  it("matches via synonym map", () => {
    expect(resolveCategory("makan")).toBe("Makanan");
    expect(resolveCategory("resto")).toBe("Makanan");
    expect(resolveCategory("indomaret")).toBe("Belanja Harian");
    expect(resolveCategory("kopi")).toBe("Kopi & Nongkrong");
    expect(resolveCategory("bensin")).toBe("Transportasi / Bensin");
    expect(resolveCategory("listrik")).toBe("Tagihan & Langganan");
  });

  it("returns null for unknown category", () => {
    expect(resolveCategory("xyzabc")).toBeNull();
  });
});

describe("CATEGORY_SYNONYMS", () => {
  it("contains all main categories", () => {
    const categories = Object.keys(CATEGORY_SYNONYMS);
    expect(categories).toContain("Makanan");
    expect(categories).toContain("Belanja Harian");
    expect(categories).toContain("Kopi & Nongkrong");
    expect(categories).toContain("Transportasi / Bensin");
    expect(categories).toContain("Tagihan & Langganan");
    expect(categories).toContain("Hiburan");
    expect(categories).toContain("Kesehatan");
    expect(categories).toContain("Transfer / Top Up");
    expect(categories).toContain("Lainnya");
  });
});
