const DB_NAME = 'RoofAppDB';
const DB_VERSION = 1;
const STORES = {
  estimates: 'estimates',
  syncQueue: 'syncQueue',
  photos: 'photos',
};

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Estimates store
      if (!database.objectStoreNames.contains(STORES.estimates)) {
        const estimatesStore = database.createObjectStore(STORES.estimates, {
          keyPath: 'id',
        });
        estimatesStore.createIndex('status', 'status', { unique: false });
        estimatesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Sync queue for offline changes
      if (!database.objectStoreNames.contains(STORES.syncQueue)) {
        const syncStore = database.createObjectStore(STORES.syncQueue, {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // Photos store for large binary data
      if (!database.objectStoreNames.contains(STORES.photos)) {
        const photosStore = database.createObjectStore(STORES.photos, {
          keyPath: 'id',
        });
        photosStore.createIndex('estimateId', 'estimateId', { unique: false });
      }
    };
  });
}

// Generic CRUD operations
async function getStore(
  storeName: string,
  mode: IDBTransactionMode = 'readonly'
): Promise<IDBObjectStore> {
  const database = await initDB();
  const transaction = database.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

export async function put<T>(storeName: string, data: T): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function get<T>(storeName: string, key: string): Promise<T | undefined> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function remove(storeName: string, key: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clear(storeName: string): Promise<void> {
  const store = await getStore(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Estimate-specific operations
export async function saveEstimateOffline(estimate: unknown): Promise<void> {
  await put(STORES.estimates, estimate);
}

export async function getEstimatesOffline(): Promise<unknown[]> {
  return getAll(STORES.estimates);
}

export async function deleteEstimateOffline(id: string): Promise<void> {
  await remove(STORES.estimates, id);
}

// Photo operations (for large binary data)
export async function savePhotoOffline(photo: {
  id: string;
  estimateId: string;
  dataUrl: string;
}): Promise<void> {
  await put(STORES.photos, photo);
}

export async function getPhotosByEstimate(estimateId: string): Promise<unknown[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.photos, 'readonly');
    const store = transaction.objectStore(STORES.photos);
    const index = store.index('estimateId');
    const request = index.getAll(estimateId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export { STORES };
