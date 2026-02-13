import { useState, useEffect, useCallback } from 'react';
import { getSyncStatus, processSyncQueue, markSyncComplete } from '../utils/syncQueue';

interface OfflineState {
  isOnline: boolean;
  pendingSync: number;
  lastSync: Date | null;
  isSyncing: boolean;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    pendingSync: 0,
    lastSync: null,
    isSyncing: false,
  });

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      syncNow();
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load sync status on mount
  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setState((prev) => ({
        ...prev,
        pendingSync: status.pending,
        lastSync: status.lastSync,
      }));
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return { success: 0, failed: 0 };

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      const result = await processSyncQueue();
      markSyncComplete();
      await loadSyncStatus();
      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      return { success: 0, failed: 0 };
    } finally {
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, []);

  // Listen for service worker sync messages
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
          loadSyncStatus();
        }
      });
    }
  }, []);

  return {
    ...state,
    syncNow,
    refreshStatus: loadSyncStatus,
  };
}
