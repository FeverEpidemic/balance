import { describe, expect, it } from "vitest";
import { describeBudgetUsage, getMonthDateRange, parseNumberInput } from "../../lib/finance";
import { formatCurrency } from "../../lib/utils";

describe("finance helpers", () => {
  it("parses numeric input from formatted currency strings", () => {
    expect(parseNumberInput("Rp 1.250.000")).toBe(1250000);
    expect(parseNumberInput("40000")).toBe(40000);
    expect(parseNumberInput("bukan angka")).toBeNull();
  });

  it("builds the correct month date range", () => {
    expect(getMonthDateRange("2026-05")).toEqual({
      start: "2026-05-01",
      end: "2026-05-31"
    });
  });

  it("formats budget usage consistently in IDR", () => {
    expect(describeBudgetUsage(250000, 500000)).toBe(`${formatCurrency(250000)} dari ${formatCurrency(500000)} (50%)`);
    expect(describeBudgetUsage(0, 0)).toBe("Belum ada limit");
  });
});
