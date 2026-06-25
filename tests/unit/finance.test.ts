import { describe, expect, it } from "vitest";
import {
  describeBudgetUsage,
  getMonthDateRange,
  getPreviousSalaryPeriod,
  getSalaryPeriodRange,
  getSalaryPeriodStart,
  isSameSalaryPeriod,
  parseNumberInput
} from "../../lib/finance";
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

describe("getSalaryPeriodStart", () => {
  it("returns month start for cycleDay=1", () => {
    expect(getSalaryPeriodStart("2026-06", 1)).toBe("2026-06-01");
  });
  it("returns cycle day for cycleDay=25", () => {
    expect(getSalaryPeriodStart("2026-06", 25)).toBe("2026-06-25");
  });
  it("handles cycleDay=28 in February", () => {
    expect(getSalaryPeriodStart("2026-02", 28)).toBe("2026-02-28");
  });
});

describe("getSalaryPeriodRange", () => {
  it("calendar month for cycleDay=1", () => {
    expect(getSalaryPeriodRange("2026-06", 1)).toEqual({ start: "2026-06-01", end: "2026-06-30" });
  });
  it("salary period for cycleDay=25", () => {
    expect(getSalaryPeriodRange("2026-06", 25)).toEqual({ start: "2026-06-25", end: "2026-07-24" });
  });
  it("cross-year boundary", () => {
    expect(getSalaryPeriodRange("2026-12", 25)).toEqual({ start: "2026-12-25", end: "2027-01-24" });
  });
});

describe("isSameSalaryPeriod", () => {
  it("matches calendar month for cycleDay=1", () => {
    expect(isSameSalaryPeriod("2026-06-15", "2026-06", 1)).toBe(true);
  });
  it("matches salary period for cycleDay=25", () => {
    expect(isSameSalaryPeriod("2026-06-26", "2026-06", 25)).toBe(true);
    expect(isSameSalaryPeriod("2026-06-24", "2026-06", 25)).toBe(false);
    expect(isSameSalaryPeriod("2026-07-24", "2026-06", 25)).toBe(true);
    expect(isSameSalaryPeriod("2026-07-25", "2026-06", 25)).toBe(false);
  });
});
