import { describe, expect, it } from "vitest";
import { getSalaryPeriodRange, formatSalaryPeriodLabel } from "@/lib/finance";

describe("getSalaryPeriodRange untuk AI context", () => {
  it("cycleDay=25 bulan Juni menghasilkan range 25 Jun – 24 Jul", () => {
    const range = getSalaryPeriodRange("2026-06", 25);
    expect(range.start).toBe("2026-06-25");
    expect(range.end).toBe("2026-07-24");
  });

  it("cycleDay=1 fallback ke kalender (1 Jun – 30 Jun)", () => {
    const range = getSalaryPeriodRange("2026-06", 1);
    expect(range.start).toBe("2026-06-01");
    expect(range.end).toBe("2026-06-30");
  });

  it("cross-year: cycleDay=28 bulan Desember menghasilkan 28 Des – 27 Jan", () => {
    const range = getSalaryPeriodRange("2026-12", 28);
    expect(range.start).toBe("2026-12-28");
    expect(range.end).toBe("2027-01-27");
  });
});

describe("formatSalaryPeriodLabel untuk AI context", () => {
  it("cycleDay=25 menampilkan label rentang", () => {
    const label = formatSalaryPeriodLabel("2026-06", 25);
    expect(label).toContain("25");
    expect(label).toContain("24");
  });

  it("cycleDay=1 menampilkan label bulan", () => {
    const label = formatSalaryPeriodLabel("2026-06", 1);
    expect(label).toContain("Juni");
    expect(label).not.toContain("–");
  });
});
