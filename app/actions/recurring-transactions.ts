"use server";

import { requireUser } from "@/lib/auth";
import { invalidateWalletReadCaches } from "@/lib/data/cache";
import { findFirstRunAtOrAfter, normalizeScheduledDate } from "@/lib/recurring";
import {
  errorResult,
  getNullableText,
  getNumericValue,
  getStringValue,
  revalidateWalletPaths,
  successResult,
  type ActionResult
} from "@/app/actions/_shared";
import type { RecurringFrequency, RecurringStatus } from "@/lib/data";
import { isValidDateString } from "@/lib/utils";

const ALLOWED_FREQUENCIES = new Set<RecurringFrequency>(["daily", "weekly", "monthly"]);

function readRecurringForm(formData: FormData) {
  return {
    walletId: getStringValue(formData, "wallet_id"),
    recurringTransactionId: getStringValue(formData, "recurring_transaction_id"),
    kind: getStringValue(formData, "kind") || "expense",
    categoryId: getStringValue(formData, "category_id"),
    note: getNullableText(formData, "note"),
    amount: getNumericValue(formData, "amount"),
    frequency: getStringValue(formData, "frequency"),
    intervalCount: getNumericValue(formData, "interval_count"),
    startDate: getStringValue(formData, "start_date"),
    endDate: getStringValue(formData, "end_date")
  };
}

function validateRecurringInput(input: ReturnType<typeof readRecurringForm>) {
  if (!input.startDate || !isValidDateString(input.startDate)) {
    return "Tanggal mulai recurring harus diisi dengan format yang valid.";
  }

  if (input.endDate && !isValidDateString(input.endDate)) {
    return "Tanggal akhir recurring harus valid.";
  }

  if (input.endDate && input.endDate < input.startDate) {
    return "Tanggal akhir tidak boleh sebelum tanggal mulai.";
  }

  if (!input.amount || input.amount <= 0) {
    return "Nominal recurring harus lebih besar dari nol.";
  }

  if (!input.intervalCount || input.intervalCount < 1) {
    return "Interval recurring minimal 1.";
  }

  if (!ALLOWED_FREQUENCIES.has(input.frequency as RecurringFrequency)) {
    return "Frekuensi recurring tidak valid.";
  }

  return null;
}

function buildScheduleFields(args: {
  startDate: string;
  endDate: string;
  frequency: RecurringFrequency;
  intervalCount: number;
}) {
  const nextRunDate = findFirstRunAtOrAfter({
    startDate: args.startDate,
    frequency: args.frequency,
    intervalCount: args.intervalCount,
    referenceDate: new Date()
  });
  const endBoundary = args.endDate ? normalizeScheduledDate(args.endDate) : null;

  return {
    status: (endBoundary && nextRunDate.getTime() > endBoundary.getTime() ? "ended" : "active") as RecurringStatus,
    nextRunAt: nextRunDate.toISOString()
  };
}

export async function createRecurringTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const input = readRecurringForm(formData);
  const validationError = validateRecurringInput(input);

  if (validationError) {
    return errorResult(validationError);
  }

  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("recurring_transactions").insert({
    wallet_id: input.walletId,
    category_id: input.categoryId || null,
    kind: input.kind,
    amount: input.amount,
    note: input.note,
    frequency: input.frequency,
    interval_count: input.intervalCount,
    start_date: input.startDate,
    end_date: input.endDate || null,
    next_run_at: normalizeScheduledDate(input.startDate).toISOString(),
    status: "active",
    created_by: user.id,
    updated_by: user.id
  });

  if (error) {
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(input.walletId, { targets: ["recurring"] });
  await revalidateWalletPaths(input.walletId, {
    sections: ["recurring"]
  });
  return successResult("Recurring transaction berhasil disimpan.", { resetForm: true });
}

export async function updateRecurringTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const input = readRecurringForm(formData);
  const validationError = validateRecurringInput(input);

  if (validationError) {
    return errorResult(validationError);
  }

  if (!input.recurringTransactionId) {
    return errorResult("Recurring transaction tidak ditemukan.");
  }

  const { supabase, user } = await requireUser();
  const { data: existing, error: existingError } = await supabase
    .from("recurring_transactions")
    .select("status")
    .eq("id", input.recurringTransactionId)
    .eq("wallet_id", input.walletId)
    .maybeSingle();

  if (existingError || !existing) {
    return errorResult(existingError?.message ?? "Recurring transaction tidak ditemukan.");
  }

  const schedule = buildScheduleFields({
    startDate: input.startDate,
    endDate: input.endDate,
    frequency: input.frequency as RecurringFrequency,
    intervalCount: input.intervalCount ?? 1
  });

  const { error } = await supabase
    .from("recurring_transactions")
    .update({
      category_id: input.categoryId || null,
      kind: input.kind,
      amount: input.amount,
      note: input.note,
      frequency: input.frequency,
      interval_count: input.intervalCount,
      start_date: input.startDate,
      end_date: input.endDate || null,
      next_run_at: schedule.nextRunAt,
      status: existing.status === "ended" ? "ended" : existing.status === "paused" ? "paused" : schedule.status,
      updated_by: user.id
    })
    .eq("id", input.recurringTransactionId)
    .eq("wallet_id", input.walletId);

  if (error) {
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(input.walletId, { targets: ["recurring"] });
  await revalidateWalletPaths(input.walletId, {
    sections: ["recurring"]
  });
  return successResult("Recurring transaction berhasil diperbarui.");
}

export async function pauseRecurringTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const walletId = getStringValue(formData, "wallet_id");
  const recurringTransactionId = getStringValue(formData, "recurring_transaction_id");
  const { supabase, user } = await requireUser();

  if (!recurringTransactionId) {
    return errorResult("Recurring transaction tidak ditemukan.");
  }

  const { error } = await supabase
    .from("recurring_transactions")
    .update({
      status: "paused",
      updated_by: user.id
    })
    .eq("id", recurringTransactionId)
    .eq("wallet_id", walletId);

  if (error) {
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(walletId, { targets: ["recurring"] });
  await revalidateWalletPaths(walletId, {
    sections: ["recurring"]
  });
  return successResult("Recurring transaction dijeda.");
}

export async function resumeRecurringTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const walletId = getStringValue(formData, "wallet_id");
  const recurringTransactionId = getStringValue(formData, "recurring_transaction_id");
  const { supabase, user } = await requireUser();

  if (!recurringTransactionId) {
    return errorResult("Recurring transaction tidak ditemukan.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("recurring_transactions")
    .select("start_date, end_date, frequency, interval_count, status")
    .eq("id", recurringTransactionId)
    .eq("wallet_id", walletId)
    .maybeSingle();

  if (existingError || !existing) {
    return errorResult(existingError?.message ?? "Recurring transaction tidak ditemukan.");
  }

  const schedule = buildScheduleFields({
    startDate: existing.start_date,
    endDate: existing.end_date ?? "",
    frequency: existing.frequency as RecurringFrequency,
    intervalCount: existing.interval_count
  });

  if (schedule.status === "ended") {
    return errorResult("Recurring transaction sudah berakhir dan tidak bisa dilanjutkan.");
  }

  const { error } = await supabase
    .from("recurring_transactions")
    .update({
      status: "active",
      next_run_at: schedule.nextRunAt,
      updated_by: user.id
    })
    .eq("id", recurringTransactionId)
    .eq("wallet_id", walletId);

  if (error) {
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(walletId, { targets: ["recurring"] });
  await revalidateWalletPaths(walletId, {
    sections: ["recurring"]
  });
  return successResult("Recurring transaction dilanjutkan kembali.");
}

export async function deleteRecurringTransaction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const walletId = getStringValue(formData, "wallet_id");
  const recurringTransactionId = getStringValue(formData, "recurring_transaction_id");
  const { supabase } = await requireUser();

  if (!recurringTransactionId) {
    return errorResult("Recurring transaction tidak ditemukan.");
  }

  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", recurringTransactionId)
    .eq("wallet_id", walletId);

  if (error) {
    return errorResult(error.message);
  }

  await invalidateWalletReadCaches(walletId, { targets: ["recurring"] });
  await revalidateWalletPaths(walletId, {
    sections: ["recurring"]
  });
  return successResult("Recurring transaction berhasil dihapus.");
}
