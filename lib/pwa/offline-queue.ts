const DB_NAME = "balance-offline-queue";
const DB_VERSION = 1;
const STORE_NAME = "transactions";

export interface QueuedTransaction {
  id?: number;
  url: string; // e.g. "/api/transactions"
  method: string; // "POST"
  body: unknown; // The JSON body
  headers: Record<string, string>;
  createdAt: number; // Date.now()
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueTransaction(
  tx: Omit<QueuedTransaction, "id" | "createdAt">
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_NAME, "readwrite");
    const store = txn.objectStore(STORE_NAME);
    store.add({ ...tx, createdAt: Date.now() });
    txn.oncomplete = () => resolve();
    txn.onerror = () => reject(txn.error);
  });
}

export async function getQueuedTransactions(): Promise<QueuedTransaction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_NAME, "readonly");
    const store = txn.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function removeQueuedTransaction(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_NAME, "readwrite");
    const store = txn.objectStore(STORE_NAME);
    store.delete(id);
    txn.oncomplete = () => resolve();
    txn.onerror = () => reject(txn.error);
  });
}

export async function clearQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const txn = db.transaction(STORE_NAME, "readwrite");
    const store = txn.objectStore(STORE_NAME);
    store.clear();
    txn.oncomplete = () => resolve();
    txn.onerror = () => reject(txn.error);
  });
}

/** Register for background sync with the SW. Safe to call multiple times — the browser deduplicates. */
export async function registerBackgroundSync(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("SyncManager" in window)) return;
  const registration = await navigator.serviceWorker.ready;
  try {
    await registration.sync.register("sync-transactions");
  } catch {
    // SyncManager may not be available (e.g. Firefox, non-HTTPS localhost)
  }
}

/** Attempt to flush all queued transactions to the server. Returns the IDs of successfully synced items. */
export async function flushQueue(): Promise<number[]> {
  const items = await getQueuedTransactions();
  const synced: number[] = [];

  for (const item of items) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: { "Content-Type": "application/json", ...item.headers },
        body: JSON.stringify(item.body)
      });
      if (response.ok && item.id !== undefined) {
        synced.push(item.id);
        await removeQueuedTransaction(item.id);
      }
    } catch {
      // Stop on first failure — remaining items will be retried on next sync
      break;
    }
  }

  return synced;
}
