import { describe, expect, it } from "vitest";
import {
  TRANSACTION_HISTORY_PAGE_SIZE,
  clampTransactionHistoryPageIndex,
  sliceTransactionHistoryPageItems
} from "../../lib/transaction-history-pagination";

describe("transaction history pagination", () => {
  it("keeps the second page reachable when transaction count exceeds one page", () => {
    const items = Array.from({ length: TRANSACTION_HISTORY_PAGE_SIZE + 1 }, (_, index) => `t${index + 1}`);
    const pageItems = sliceTransactionHistoryPageItems(items, 1, TRANSACTION_HISTORY_PAGE_SIZE);

    expect(clampTransactionHistoryPageIndex(1, items.length, TRANSACTION_HISTORY_PAGE_SIZE)).toBe(1);
    expect(pageItems).toEqual([`t${TRANSACTION_HISTORY_PAGE_SIZE + 1}`]);
  });

  it("clamps the page index back to the first page when the filtered result shrinks", () => {
    expect(clampTransactionHistoryPageIndex(1, 5, TRANSACTION_HISTORY_PAGE_SIZE)).toBe(0);
    expect(clampTransactionHistoryPageIndex(3, 0, TRANSACTION_HISTORY_PAGE_SIZE)).toBe(0);
  });
});
