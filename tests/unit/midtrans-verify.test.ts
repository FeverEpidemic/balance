import crypto from "node:crypto";
import { describe, it, expect, beforeAll } from "vitest";
import { verifyNotificationSignature } from "@/lib/midtrans/verify";

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

  it("returns valid=true for a correctly signed notification", () => {
    const signature = crypto
      .createHash("sha512")
      .update("ORDER-123" + "200" + "29000.00" + "test-server-key")
      .digest("hex");

    const result = verifyNotificationSignature({
      order_id: "ORDER-123",
      status_code: "200",
      gross_amount: "29000.00",
      signature_key: signature,
      transaction_status: "settlement",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects a valid signature reused with a different amount", () => {
    const signature = crypto
      .createHash("sha512")
      .update("ORDER-123" + "200" + "29000.00" + "test-server-key")
      .digest("hex");

    const result = verifyNotificationSignature({
      order_id: "ORDER-123",
      status_code: "200",
      gross_amount: "1.00",
      signature_key: signature,
      transaction_status: "settlement",
    });
    expect(result.valid).toBe(false);
  });
});
