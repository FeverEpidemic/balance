import { describe, expect, it } from "vitest";
import { shouldForceTransactionToolCall } from "@/lib/ai/read-intent";

describe("shouldForceTransactionToolCall", () => {
  it("forces tool calls for transaction questions with relative dates", () => {
    expect(shouldForceTransactionToolCall("transaksi kemarin berapa?")).toBe(true);
    expect(shouldForceTransactionToolCall("apa aja transaksi hari ini")).toBe(true);
  });

  it("forces tool calls for transaction detail questions without explicit dates", () => {
    expect(shouldForceTransactionToolCall("daftar transaksi terakhir saya")).toBe(true);
  });

  it("does not force tool calls for generic recap questions", () => {
    expect(shouldForceTransactionToolCall("pengeluaran bulan ini gimana?")).toBe(false);
    expect(shouldForceTransactionToolCall("analisis budget makan saya")).toBe(false);
  });
});
