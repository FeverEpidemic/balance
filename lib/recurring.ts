import type { RecurringFrequency } from "@/lib/data/types";
import { isValidDateString } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseUtcDateString(value: string) {
  if (!isValidDateString(value)) {
    throw new Error(`Invalid date string: ${value}`);
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toUtcStartOfDay(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function addUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY_MS);
}

function addUtcMonthsAnchored(value: Date, months: number, anchorDay: number) {
  const targetMonthIndex = value.getUTCMonth() + months;
  const year = value.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const month = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(anchorDay, lastDay)));
}

export function normalizeScheduledDate(value: string | Date) {
  if (typeof value === "string") {
    return parseUtcDateString(value);
  }

  return toUtcStartOfDay(value);
}

export function calculateNextOccurrence(args: {
  currentRunAt: string | Date;
  startDate: string;
  frequency: RecurringFrequency;
  intervalCount: number;
}) {
  const { currentRunAt, startDate, frequency, intervalCount } = args;
  const normalizedCurrent = normalizeScheduledDate(currentRunAt);
  const anchorDay = normalizeScheduledDate(startDate).getUTCDate();

  if (frequency === "daily") {
    return addUtcDays(normalizedCurrent, intervalCount);
  }

  if (frequency === "weekly") {
    return addUtcDays(normalizedCurrent, intervalCount * 7);
  }

  return addUtcMonthsAnchored(normalizedCurrent, intervalCount, anchorDay);
}

export function findFirstRunAtOrAfter(args: {
  startDate: string;
  frequency: RecurringFrequency;
  intervalCount: number;
  referenceDate?: string | Date;
}) {
  const { startDate, frequency, intervalCount, referenceDate = new Date() } = args;
  let occurrence = normalizeScheduledDate(startDate);
  const threshold = normalizeScheduledDate(referenceDate);

  while (occurrence.getTime() < threshold.getTime()) {
    occurrence = calculateNextOccurrence({
      currentRunAt: occurrence,
      startDate,
      frequency,
      intervalCount
    });
  }

  return occurrence;
}
