/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Extend ServiceWorkerRegistration with the Background Sync API (SyncManager)
// TypeScript's DOM lib doesn't include it by default as of ES2022.
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  readonly sync: SyncManager;
}
