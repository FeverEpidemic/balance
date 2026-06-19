import "server-only";

/**
 * System prompt for the vision LLM.
 * Instructs Gemini to extract Indonesian receipt/transaction data as JSON.
 */
export const OCR_SYSTEM_PROMPT = `Anda adalah OCR scanner untuk struk/pemberitahuan transaksi Indonesia.

Tugas Anda: Ekstrak informasi transaksi dari gambar yang diberikan.

Aturan:
1. Jumlah (amount) HARUS dalam angka saja, tanpa "Rp", tanpa "IDR", tanpa titik/koma pemisah ribuan. Contoh: "Rp 38.200" → 38200.
2. Kategori (category) HARUS salah satu dari daftar ini:
   - Makanan (makan di resto/warung)
   - Belanja Harian (minimarket, alfamidi, indomaret, supermarket)
   - Kopi & Nongkrong (kafe, kopi)
   - Transportasi / Bensin (bensin, tol, parkir, transport)
   - Tagihan & Langganan (listrik, air, internet, pulsa)
   - Hiburan (bioskop, game, liburan)
   - Kesehatan (obat, dokter)
   - Transfer / Top Up (kirim uang, top up e-wallet)
   - Lainnya (tidak ada yang cocok)
3. Tanggal (date) HARUS format YYYY-MM-DD.
4. Jenis transaksi (kind): "expense" untuk pengeluaran, "income" untuk pemasukan.
5. Catatan (note): deskripsi singkat transaksi.

Response HARUS berupa JSON saja, tidak ada teks lain:
{
  "amount": 38200,
  "category": "Belanja Harian",
  "date": "2026-06-18",
  "note": "MIDI REGULER D - rokok & air mineral",
  "kind": "expense",
  "merchant": "MIDI REGULER D",
  "paymentMethod": "QRIS"
}`;

export interface OcrTransactionResult {
  amount: number;
  category: string;
  date: string;
  note: string;
  kind: "expense" | "income";
  merchant: string;
  paymentMethod: string;
}

/**
 * Synonym map for fuzzy category matching.
 * Maps common variations to canonical Balance category names.
 */
export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "Makanan": ["makan", "makanan", "resto", "restoran", "warung", "makan siang", "dinner", "lunch", "nasi", "bakso", "mie", "soto", "ayam"],
  "Belanja Harian": ["belanja", "belanja harian", "minimarket", "supermarket", "indomaret", "alfamart", "alfamidi", "sembako", "grosir"],
  "Kopi & Nongkrong": ["kopi", "kafe", "cafe", "nongkrong", "coffee", "boba", "teh"],
  "Transportasi / Bensin": ["bensin", "transport", "transportasi", "tol", "parkir", "bbm", "solar", "pertalite", "pertamax"],
  "Tagihan & Langganan": ["tagihan", "langganan", "listrik", "air", "pdam", "pulsa", "internet", "wifi", "pln", "bpjs"],
  "Hiburan": ["hiburan", "bioskop", "game", "liburan", "film", "netflix", "spotify", "steam"],
  "Kesehatan": ["kesehatan", "obat", "dokter", "apotek", "klinik", "rumah sakit", "rs", "vitamin"],
  "Transfer / Top Up": ["transfer", "top up", "topup", "kirim uang", "e-wallet", "gopay", "ovo", "dana", "shopeepay"],
  "Lainnya": ["lainnya", "lain", "other", "others"],
};

/**
 * Resolve a vision model's category output to a canonical Balance category.
 * Falls back to returning the input if no match found.
 */
export function resolveCategory(ocrCategory: string): string | null {
  const cleaned = ocrCategory.trim().toLowerCase();

  // 1. Exact match (case-insensitive)
  for (const canonical of Object.keys(CATEGORY_SYNONYMS)) {
    if (canonical.toLowerCase() === cleaned) return canonical;
  }

  // 2. Synonym match
  for (const [canonical, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    for (const syn of synonyms) {
      if (syn.toLowerCase() === cleaned || cleaned.includes(syn.toLowerCase()) || syn.toLowerCase().includes(cleaned)) {
        return canonical;
      }
    }
  }

  // 3. Prefix match (e.g. "Belanja" → "Belanja Harian")
  for (const canonical of Object.keys(CATEGORY_SYNONYMS)) {
    if (canonical.toLowerCase().startsWith(cleaned) || cleaned.startsWith(canonical.toLowerCase())) {
      return canonical;
    }
  }

  return null;
}

/**
 * Parse the LLM's raw text response into structured OcrTransactionResult.
 * Handles markdown code fences and extraneous text gracefully.
 * Returns null if parsing fails or the result is invalid.
 */
export function parseOcrResponse(rawText: string): OcrTransactionResult | null {
  try {
    const trimmed = rawText.trim();
    if (!trimmed) return null;

    // Strip markdown code fences
    let cleaned = trimmed;
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    // Try to find JSON object in the text (handles models that add commentary)
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    const amount = Math.abs(Number(parsed.amount ?? 0));
    if (!amount || amount <= 0) return null;

    const rawCategory = String(parsed.category ?? "").trim();
    const category = resolveCategory(rawCategory) || rawCategory || "Lainnya";

    return {
      amount,
      category,
      date: String(parsed.date ?? "").trim(),
      note: String(parsed.note ?? "").trim(),
      kind: String(parsed.kind ?? "expense").trim() === "income" ? "income" : "expense",
      merchant: String(parsed.merchant ?? "").trim(),
      paymentMethod: String(parsed.paymentMethod ?? "").trim(),
    };
  } catch {
    return null;
  }
}
