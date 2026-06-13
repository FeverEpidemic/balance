import { describe, expect, it } from "vitest";
import {
  getBalanceAdjustmentCategoryName,
  getBalanceAdjustmentTitle,
  getBalanceAdjustmentValidationError,
  isBalanceAdjustmentCategory,
  resolveBalanceAdjustment
} from "../../lib/balance-adjustments";

describe("balance adjustment helpers", () => {
  it("returns consistent system category names and titles", () => {
    expect(getBalanceAdjustmentCategoryName("income")).toBe("Penyesuaian Saldo Masuk");
    expect(getBalanceAdjustmentCategoryName("expense")).toBe("Penyesuaian Saldo Keluar");
    expect(getBalanceAdjustmentTitle("income")).toBe("Penyesuaian saldo masuk");
    expect(getBalanceAdjustmentTitle("expense")).toBe("Penyesuaian saldo keluar");
  });

  it("detects system categories for balance adjustments only", () => {
    expect(
      isBalanceAdjustmentCategory({
        kind: "income",
        name: "Penyesuaian Saldo Masuk",
        is_system: true
      })
    ).toBe(true);
    expect(
      isBalanceAdjustmentCategory({
        kind: "expense",
        name: "Belanja Harian",
        is_system: false
      })
    ).toBe(false);
  });

  it("validates note, amount, and date for balance adjustments", () => {
    expect(
      getBalanceAdjustmentValidationError({
        actualBalance: null,
        happenedAt: "2026-05-29",
        note: "Koreksi kas",
        isValidDate: true
      })
    ).toBe("Saldo aktual harus diisi dengan nominal yang valid.");

    expect(
      getBalanceAdjustmentValidationError({
        actualBalance: 10000,
        happenedAt: "2026-02-31",
        note: "Koreksi kas",
        isValidDate: false
      })
    ).toBe("Tanggal penyesuaian saldo harus diisi dengan format yang valid.");

    expect(
      getBalanceAdjustmentValidationError({
        actualBalance: 10000,
        happenedAt: "2026-05-29",
        note: "   ",
        isValidDate: true
      })
    ).toBe("Alasan penyesuaian saldo wajib diisi.");

    expect(
      getBalanceAdjustmentValidationError({
        actualBalance: 10000,
        happenedAt: "2026-05-29",
        note: "Koreksi kas",
        isValidDate: true
      })
    ).toBeNull();
  });

  it("derives adjustment direction and amount from the actual balance", () => {
    expect(resolveBalanceAdjustment(100000, 130000)).toEqual({
      amount: 30000,
      direction: "increase",
      kind: "income"
    });

    expect(resolveBalanceAdjustment(100000, 85000)).toEqual({
      amount: 15000,
      direction: "decrease",
      kind: "expense"
    });

    expect(resolveBalanceAdjustment(100000, 100000)).toBeNull();
  });
});
