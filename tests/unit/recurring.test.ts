import { describe, expect, it } from "vitest";
import { calculateNextOccurrence, findFirstRunAtOrAfter, normalizeScheduledDate } from "../../lib/recurring";

describe("recurring helpers", () => {
  it("normalizes date strings to UTC midnight", () => {
    expect(normalizeScheduledDate("2026-05-29").toISOString()).toBe("2026-05-29T00:00:00.000Z");
  });

  it("calculates the next daily and weekly occurrences", () => {
    expect(
      calculateNextOccurrence({
        currentRunAt: "2026-05-29",
        startDate: "2026-05-29",
        frequency: "daily",
        intervalCount: 2
      }).toISOString()
    ).toBe("2026-05-31T00:00:00.000Z");

    expect(
      calculateNextOccurrence({
        currentRunAt: "2026-05-29",
        startDate: "2026-05-29",
        frequency: "weekly",
        intervalCount: 1
      }).toISOString()
    ).toBe("2026-06-05T00:00:00.000Z");
  });

  it("keeps the original monthly anchor day when months are shorter", () => {
    expect(
      calculateNextOccurrence({
        currentRunAt: "2026-01-31",
        startDate: "2026-01-31",
        frequency: "monthly",
        intervalCount: 1
      }).toISOString()
    ).toBe("2026-02-28T00:00:00.000Z");

    expect(
      calculateNextOccurrence({
        currentRunAt: "2026-02-28",
        startDate: "2026-01-31",
        frequency: "monthly",
        intervalCount: 1
      }).toISOString()
    ).toBe("2026-03-31T00:00:00.000Z");
  });

  it("finds the first active run at or after a reference date", () => {
    expect(
      findFirstRunAtOrAfter({
        startDate: "2026-05-01",
        frequency: "weekly",
        intervalCount: 1,
        referenceDate: "2026-05-20"
      }).toISOString()
    ).toBe("2026-05-22T00:00:00.000Z");
  });
});
