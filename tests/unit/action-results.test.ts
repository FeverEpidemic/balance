import { describe, expect, it } from "vitest";
import { errorResult, initialActionResult, successResult } from "@/app/actions/action-result";

describe("action result helpers", () => {
  it("provides an idle initial state", () => {
    expect(initialActionResult).toEqual({
      status: "idle"
    });
  });

  it("builds a success result with optional reset flag", () => {
    expect(successResult("Saved", { resetForm: true })).toEqual({
      status: "success",
      message: "Saved",
      fieldErrors: undefined,
      resetForm: true
    });
  });

  it("builds an error result with optional field errors", () => {
    expect(errorResult("Invalid", { fieldErrors: { amount: "Required" } })).toEqual({
      status: "error",
      message: "Invalid",
      fieldErrors: {
        amount: "Required"
      }
    });
  });
});
