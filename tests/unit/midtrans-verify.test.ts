import { describe, it, expect, beforeAll } from "vitest";
import { verifyNotificationSignature, isSuccessfulPayment, mapTransactionStatus } from "@/lib/midtrans/verify";

beforeAll(() => {
  process.env.MIDTRANS_SERVER_KEY = "test-server-key";
});

describe("verifyNotificationSignature", () => {
  it("returns valid=false when required fields are missing", () => {
    const result = verifyNotificationSignature({
      order_id: "",
      status_code: "",
      gross_amount: "",
      signature_key: "",
      transaction_status: "settlement",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Missing required fields for signature verification");
  });

  it("returns valid=false for mismatched signature", () => {
    const result = verifyNotificationSignature({
      order_id: "ORDER-123",
      status_code: "200",
      gross_amount: "29000.00",
      signature_key: "invalid_signature",
      transaction_status: "settlement",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Signature mismatch");
  });
});

describe("isSuccessfulPayment", () => {
  it("returns true for settlement", () => {
    expect(isSuccessfulPayment("settlement")).toBe(true);
  });

  it("returns true for capture", () => {
    expect(isSuccessfulPayment("capture")).toBe(true);
  });

  it("returns false for pending", () => {
    expect(isSuccessfulPayment("pending")).toBe(false);
  });

  it("returns false for expire", () => {
    expect(isSuccessfulPayment("expire")).toBe(false);
  });

  it("returns false for deny", () => {
    expect(isSuccessfulPayment("deny")).toBe(false);
  });

  it("returns false for cancel", () => {
    expect(isSuccessfulPayment("cancel")).toBe(false);
  });
});

describe("mapTransactionStatus", () => {
  it("maps settlement to active", () => {
    expect(mapTransactionStatus("settlement")).toBe("active");
  });

  it("maps capture to active", () => {
    expect(mapTransactionStatus("capture")).toBe("active");
  });

  it("maps pending to pending", () => {
    expect(mapTransactionStatus("pending")).toBe("pending");
  });

  it("maps expire to expired", () => {
    expect(mapTransactionStatus("expire")).toBe("expired");
  });

  it("maps cancel to cancelled", () => {
    expect(mapTransactionStatus("cancel")).toBe("cancelled");
  });

  it("maps deny to cancelled", () => {
    expect(mapTransactionStatus("deny")).toBe("cancelled");
  });

  it("maps refund to cancelled", () => {
    expect(mapTransactionStatus("refund")).toBe("cancelled");
  });

  it("maps unknown status to pending", () => {
    expect(mapTransactionStatus("unknown_status")).toBe("pending");
  });
});
