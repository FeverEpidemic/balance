import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  dateStringToISO,
  formatCurrencyInputValue,
  getTodayDateString,
  isValidDateString,
  sanitizeCurrencyInput,
  toDateInputValue
} from "../../lib/utils";

describe("date utilities", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-29T08:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("returns today's date in HTML date input format", () => {
    expect(getTodayDateString()).toBe("2026-05-29");
  });

  it("converts transaction timestamps into date input values", () => {
    expect(toDateInputValue("2026-05-10T15:45:00.000Z")).toBe("2026-05-10");
    expect(toDateInputValue("2026-05-10")).toBe("2026-05-10");
  });

  it("falls back to today's date for invalid timestamps", () => {
    expect(toDateInputValue("bukan-tanggal")).toBe("2026-05-29");
  });

  it("accepts only valid calendar dates in YYYY-MM-DD format", () => {
    expect(isValidDateString("2026-05-29")).toBe(true);
    expect(isValidDateString("2026-02-29")).toBe(false);
    expect(isValidDateString("29-05-2026")).toBe(false);
  });

  it("normalizes date input strings into ISO timestamps", () => {
    expect(dateStringToISO("2026-05-29")).toBe("2026-05-29T00:00:00.000Z");
  });
});

describe("currency input utilities", () => {
  it("sanitizes formatted rupiah strings into plain digits", () => {
    expect(sanitizeCurrencyInput("Rp325.000")).toBe("325000");
    expect(sanitizeCurrencyInput("12abc34")).toBe("1234");
  });

  it("formats plain digits into rupiah display values", () => {
    expect(formatCurrencyInputValue("325000")).toBe("Rp 325.000");
    expect(formatCurrencyInputValue(500000)).toBe("Rp 500.000");
  });

  it("returns empty string when there are no digits to show", () => {
    expect(formatCurrencyInputValue("")).toBe("");
    expect(formatCurrencyInputValue("abc")).toBe("");
  });
});
