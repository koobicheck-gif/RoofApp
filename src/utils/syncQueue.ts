import { put, getAll, remove, STORES } from './offlineStorage';

export interface SyncQueueItem {
  id?: number;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'estimate' | 'photo' | 'job';
  entityId: string;
  data?: unknown;
  timestamp: Date;
  attempts: number;
  lastError?: string;
}

// Add item to sync queue
export async function addToSyncQueue(
  item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>
): Promise<void> {
  await put(STORES.syncQueue, {
    ...item,
    timestamp: new Date(),
    attempts: 0,
  });
}

// Get all pending sync items
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  return getAll(STORES.syncQueue);
}

// Remove item from sync queue after successful sync
export async function removeSyncItem(id: number): Promise<void> {
  await remove(STORES.syncQueue, String(id));
}

// Update sync item (e.g., increment attempts)
export async function updateSyncItem(item: SyncQueueItem): Promise<void> {
  await put(STORES.syncQueue, item);
}

// Process sync queue when online
export async function processSyncQueue(): Promise<{
  success: number;
  failed: number;
}> {
  const items = await getPendingSyncItems();
  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // Future: send to backend API
      // For now, just mark as synced (since we're local-only)
      await removeSyncItem(item.id!);
      success++;
    } catch (error) {
      item.attempts++;
      item.lastError = error instanceof Error ? error.message : 'Unknown error';
      await updateSyncItem(item);
      failed++;
    }
  }

  return { success, failed };
}

// Get sync status
export async function getSyncStatus(): Promise<{
  pending: number;
  lastSync: Date | null;
}> {
  const items = await getPendingSyncItems();
  const lastSyncStr = localStorage.getItem('roofapp_last_sync');

  return {
    pending: items.length,
    lastSync: lastSyncStr ? new Date(lastSyncStr) : null,
  };
}

// Mark sync complete
export function markSyncComplete(): void {
  localStorage.setItem('roofapp_last_sync', new Date().toISOString());
}

// Request background sync (if supported)
export async function requestBackgroundSync(): Promise<boolean> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-estimates');
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
