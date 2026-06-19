import "server-only";

import crypto from "node:crypto";
import { getMidtransServerKey } from "@/lib/midtrans/config";

export type MidtransNotification = {
  /** Order ID from our transaction_details.order_id. */
  order_id: string;
  /** Midtrans transaction_status: settlement, capture, pending, deny, cancel, expire, refund, partial_refund, etc. */
  transaction_status: string;
  /** Midtrans status_code (typically "200"/"201"/"202"). */
  status_code: string;
  /** Gross amount as a string (e.g. "29000.00"). */
  gross_amount: string;
  /** Signature key sent by Midtrans. */
  signature_key: string;
  /** Payment channel: gopay, bank_transfer, cstore, etc. */
  payment_type?: string;
  /** Midtrans transaction ID. */
  transaction_id?: string;
  /** Optional custom fields we set in the snap payload. */
  custom_field1?: string;
  /** ISO timestamp of the transaction. */
  transaction_time?: string;
  /** Currency (typically "IDR"). */
  currency?: string;
  /** Fraud status: accept, deny, challenge. */
  fraud_status?: string;
  /** Bank if via bank transfer. */
  bank?: string;
  /** VA number if via bank transfer. */
  va_numbers?: Array<{ bank: string; va_number: string }>;
  /** Permata VA number. */
  permata_va_number?: string;
  /** Bill key + code for Mandiri bill pay. */
  bill_key?: string;
  biller_code?: string;
  /** Store info for cstore. */
  store?: string;
  /** Payment code for cstore / Indomaret / Alfamart. */
  payment_code?: string;
  /** Any other fields. */
  [key: string]: unknown;
};

/**
 * Verifies the Midtrans Payment Notification signature.
 *
 * Midtrans signature formula:
 *   SHA512(order_id + status_code + gross_amount + server_key)
 *
 * The result (lowercase hex) must match the `signature_key` field
 * from the notification payload.
 */
export function verifyNotificationSignature(
  notification: MidtransNotification
): { valid: boolean; reason?: string } {
  const { order_id, status_code, gross_amount, signature_key } = notification;

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return { valid: false, reason: "Missing required fields for signature verification" };
  }

  const serverKey = getMidtransServerKey();

  const computed = crypto
    .createHash("sha512")
    .update(order_id + status_code + gross_amount + serverKey)
    .digest("hex");

  if (computed !== signature_key) {
    return { valid: false, reason: "Signature mismatch" };
  }

  return { valid: true };
}

/**
 * Determines whether the notification's transaction_status
 * represents a successful payment that should activate a subscription.
 */
export function isSuccessfulPayment(status: string): boolean {
  return status === "settlement" || status === "capture";
}

/**
 * Maps Midtrans transaction_status to our subscription_status values.
 */
export function mapTransactionStatus(status: string): "pending" | "active" | "expired" | "cancelled" {
  switch (status) {
    case "settlement":
    case "capture":
      return "active";
    case "pending":
      return "pending";
    case "expire":
      return "expired";
    case "cancel":
    case "deny":
      return "cancelled";
    case "refund":
    case "partial_refund":
      return "cancelled";
    default:
      return "pending";
  }
}
