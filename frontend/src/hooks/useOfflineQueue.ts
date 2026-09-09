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

  // Update pending count – declare first
  const updatePendingCount = useCallback(async () => {
    const pending = await getPendingItems();
    setPendingCount(pending.length);
  }, []);

  // Enqueue a request
  const enqueue = useCallback(
    async (
      endpoint: string,
      method: 'POST' | 'PATCH' | 'DELETE',
      payload: Record<string, unknown>
    ): Promise<QueueItem> => {
      const item = await addToQueue(endpoint, method, payload);
      if (isOnline && !isSyncing) {
        // Trigger sync in background
        void syncPendingEntries().then(() => {
          void updatePendingCount();
        });
      }
      await updatePendingCount();
      return item;
    },
    [isOnline, isSyncing, updatePendingCount]
  );

  // Trigger sync manually
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
      const doSync = async () => {
        await syncNow();
      };
      void doSync();
    }
  }, [isOnline, syncNow]);

  // Initial pending count and sync on mount
  useEffect(() => {
    const init = async () => {
      await updatePendingCount();
      if (isOnline) {
        await syncNow();
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only once on mount
  }, []);

  return { enqueue, pendingCount, syncNow, isSyncing };
}
