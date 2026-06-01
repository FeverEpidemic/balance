import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { dateStringToISO, getTodayDateString, isValidDateString, toDateInputValue } from "../../lib/utils";

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
