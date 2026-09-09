import { openDB, type IDBPDatabase } from 'idb';

// ── Types ──

export interface QueueItem {
  id: string; // local UUID
  endpoint: string; // e.g., '/income'
  method: 'POST' | 'PATCH' | 'DELETE'; // only POST for now, but keep generic
  payload: any; // the request body
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  createdAt: number;
  error?: string; // optional error message when failed
}

const DB_NAME = 'HisabMezgebOffline';
const STORE_NAME = 'queue';
const MAX_RETRIES = 5;

// ── Database connection ──

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('createdAt', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

// ── Public API ──

export async function addToQueue(
  endpoint: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  payload: any
): Promise<QueueItem> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const item: QueueItem = {
    id,
    endpoint,
    method,
    payload,
    status: 'pending',
    retryCount: 0,
    createdAt: Date.now(),
  };
  await db.add(STORE_NAME, item);
  return item;
}

export async function getPendingItems(): Promise<QueueItem[]> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('status');
  return index.getAll('pending');
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const item = await store.get(id);
  if (item) {
    item.status = 'synced';
    await store.put(item);
  }
}

export async function markFailed(id: string, error: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const item = await store.get(id);
  if (item) {
    item.status = 'failed';
    item.error = error;
    await store.put(item);
  }
}

export async function incrementRetry(id: string): Promise<number> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const item = await store.get(id);
  if (item) {
    item.retryCount += 1;
    await store.put(item);
    return item.retryCount;
  }
  return 0;
}

export async function clearSyncedItems(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('status');
  const syncedItems = await index.getAll('synced');
  for (const item of syncedItems) {
    await store.delete(item.id);
  }
}

// ── Sync Engine ──

import api from './axios'; // the axios instance with cookies

export async function syncPendingEntries(): Promise<{ succeeded: string[]; failed: string[] }> {
  const pending = await getPendingItems();
  // Process FIFO (by createdAt asc)
  pending.sort((a, b) => a.createdAt - b.createdAt);

  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const item of pending) {
    // If retry count exceeds max, mark as failed and skip
    if (item.retryCount >= MAX_RETRIES) {
      await markFailed(item.id, 'Max retries exceeded');
      failed.push(item.id);
      continue;
    }

    try {
      // Reconstruct the request
      const url = item.endpoint;
      const method = item.method.toLowerCase() as 'post' | 'patch' | 'delete';
      // We use api, which already handles cookies and unwrapping
      await api[method](url, item.payload);
      // If success, mark synced
      await markSynced(item.id);
      succeeded.push(item.id);
    } catch (error: any) {
      // If it's a 409 conflict, treat as "already synced" (benign) – mark as synced
      if (error.response?.status === 409) {
        await markSynced(item.id);
        succeeded.push(item.id);
        continue;
      }

      // Otherwise increment retry count
      await incrementRetry(item.id);
      // If now exceeds max retries, mark as failed
      const updatedItem = await getItemById(item.id);
      if (updatedItem && updatedItem.retryCount >= MAX_RETRIES) {
        await markFailed(item.id, error.message || 'Unknown error');
        failed.push(item.id);
      } else {
        // still pending for next sync
        failed.push(item.id); // not retried yet, but we will retry later
      }
    }
  }

  // Clean up synced items after a delay (optional)
  // We'll leave them for a short grace period, but we can call clearSyncedItems after a while.
  // For simplicity, we'll keep them until next sync cycle, or we can clean up after each sync.
  // We'll call clearSyncedItems to remove them.
  await clearSyncedItems();

  return { succeeded, failed };
}

// Helper to get item by id (used in sync)
async function getItemById(id: string): Promise<QueueItem | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}
