import { describe, expect, it } from "vitest";
import { isMutationLikeMessage } from "@/app/api/ai/chat/route";

describe("isMutationLikeMessage", () => {
  it("treats 'catet' as a mutation keyword", () => {
    expect(isMutationLikeMessage("catet pengeluaran 50rb buat gofood")).toBe(true);
  });

  it("does not mark analytical prompts as mutations", () => {
    expect(isMutationLikeMessage("analisis pengeluaran minggu ini")).toBe(false);
  });
});
