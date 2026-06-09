export const TRANSACTION_HISTORY_PAGE_SIZE = 12;

export function clampTransactionHistoryPageIndex(pageIndex: number, itemCount: number, pageSize: number) {
  if (pageSize <= 0) {
    return 0;
  }

  const safePageIndex = Math.max(0, pageIndex);
  const lastPageIndex = Math.max(0, Math.ceil(itemCount / pageSize) - 1);

  return Math.min(safePageIndex, lastPageIndex);
}

export function sliceTransactionHistoryPageItems<T>(items: T[], pageIndex: number, pageSize: number) {
  const safePageIndex = clampTransactionHistoryPageIndex(pageIndex, items.length, pageSize);
  const start = safePageIndex * pageSize;

  return items.slice(start, start + pageSize);
}
