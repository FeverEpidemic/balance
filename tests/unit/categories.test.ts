import { describe, expect, it } from "vitest";
import {
  CATEGORY_COLOR_PALETTE,
  isValidCategoryColor,
  isValidCategoryKind,
  normalizeCategoryName
} from "@/lib/categories";

describe("category helpers", () => {
  it("normalizes spacing in category names", () => {
    expect(normalizeCategoryName("  Langganan   kerja  ")).toBe("Langganan kerja");
  });

  it("validates supported kinds and hex colors", () => {
    expect(isValidCategoryKind("income")).toBe(true);
    expect(isValidCategoryKind("expense")).toBe(true);
    expect(isValidCategoryKind("transfer")).toBe(false);
    expect(isValidCategoryColor(CATEGORY_COLOR_PALETTE[0])).toBe(true);
    expect(isValidCategoryColor("#123abc")).toBe(true);
    expect(isValidCategoryColor("sage")).toBe(false);
  });
});
