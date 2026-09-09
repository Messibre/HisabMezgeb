import { useCallback, useEffect, useState } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import {
  addToQueue,
  syncPendingEntries,
  getPendingItems,
  type QueueItem,
} from '@/lib/offlineQueue';

export function useOfflineQueue() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Enqueue a request (optimistically saved locally)
  const enqueue = useCallback(
    async (
      endpoint: string,
      method: 'POST' | 'PATCH' | 'DELETE',
      payload: any
    ): Promise<QueueItem> => {
      const item = await addToQueue(endpoint, method, payload);
      // If we are online, trigger a sync immediately
      if (isOnline && !isSyncing) {
        // We don't await, let it run in background
        void syncPendingEntries().then(() => {
          // After sync, update pending count
          updatePendingCount();
        });
      }
      // Update pending count
      await updatePendingCount();
      return item;
    },
    [isOnline, isSyncing]
  );

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const pending = await getPendingItems();
    setPendingCount(pending.length);
  }, []);

  // Trigger sync manually (e.g., on online event)
  const syncNow = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncPendingEntries();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
      await updatePendingCount();
    }
  }, [isSyncing, updatePendingCount]);

  // Auto-sync when online changes
  useEffect(() => {
    if (isOnline) {
      void syncNow();
    }
  }, [isOnline, syncNow]);

  // Initial pending count on mount
  useEffect(() => {
    updatePendingCount();
    // Also sync on mount if online
    if (isOnline) {
      void syncNow();
    }
  }, []);

  return { enqueue, pendingCount, syncNow, isSyncing };
}
