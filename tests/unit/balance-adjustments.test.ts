import { describe, expect, it } from "vitest";
import {
  getBalanceAdjustmentCategoryName,
  getBalanceAdjustmentTitle,
  getBalanceAdjustmentValidationError,
  isBalanceAdjustmentCategory
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
        amount: null,
        happenedAt: "2026-05-29",
        note: "Koreksi kas",
        isValidDate: true
      })
    ).toBe("Nominal penyesuaian saldo harus lebih besar dari nol.");

    expect(
      getBalanceAdjustmentValidationError({
        amount: 10000,
        happenedAt: "2026-02-31",
        note: "Koreksi kas",
        isValidDate: false
      })
    ).toBe("Tanggal penyesuaian saldo harus diisi dengan format yang valid.");

    expect(
      getBalanceAdjustmentValidationError({
        amount: 10000,
        happenedAt: "2026-05-29",
        note: "   ",
        isValidDate: true
      })
    ).toBe("Alasan penyesuaian saldo wajib diisi.");

    expect(
      getBalanceAdjustmentValidationError({
        amount: 10000,
        happenedAt: "2026-05-29",
        note: "Koreksi kas",
        isValidDate: true
      })
    ).toBeNull();
  });
});
