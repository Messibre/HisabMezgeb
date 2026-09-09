import { openDB, type IDBPDatabase } from 'idb';
import api from './axios';

// ── Types ──

export interface QueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  payload: Record<string, unknown>;
  status: 'pending' | 'synced' | 'failed';
  retryCount: number;
  createdAt: number;
  error?: string;
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
  payload: Record<string, unknown>
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

// ── Helper to get item by id ──

async function getItemById(id: string): Promise<QueueItem | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

// ── Sync Engine ──

type ApiError = {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
};

function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null;
}

export async function syncPendingEntries(): Promise<{ succeeded: string[]; failed: string[] }> {
  const pending = await getPendingItems();
  pending.sort((a, b) => a.createdAt - b.createdAt);

  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const item of pending) {
    if (item.retryCount >= MAX_RETRIES) {
      await markFailed(item.id, 'Max retries exceeded');
      failed.push(item.id);
      continue;
    }

    try {
      const url = item.endpoint;
      const method = item.method.toLowerCase() as 'post' | 'patch' | 'delete';
      await api[method](url, item.payload);
      await markSynced(item.id);
      succeeded.push(item.id);
    } catch (error: unknown) {
      if (isApiError(error) && error.response?.status === 409) {
        await markSynced(item.id);
        succeeded.push(item.id);
        continue;
      }

      await incrementRetry(item.id);
      const updatedItem = await getItemById(item.id);
      if (updatedItem && updatedItem.retryCount >= MAX_RETRIES) {
        await markFailed(
          item.id,
          isApiError(error) ? error.message || 'Unknown error' : 'Unknown error'
        );
        failed.push(item.id);
      } else {
        failed.push(item.id);
      }
    }
  }

  await clearSyncedItems();
  return { succeeded, failed };
}
