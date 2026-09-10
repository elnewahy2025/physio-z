// frontend/src/lib/offline-db.ts
// IndexedDB wrapper for offline data caching and mutation queuing.

const DB_NAME = 'physio-offline';
const DB_VERSION = 1;

export interface CachedResponse {
  url: string;
  data: unknown;
  timestamp: number;
}

export interface QueuedMutation {
  id?: number;
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  body: unknown;
  timestamp: number;
  retryCount: number;
  description?: string;
}

class OfflineDB {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'url' });
        }

        if (!db.objectStoreNames.contains('queue')) {
          db.createObjectStore('queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ─── Cache operations (GET responses) ───

  async getCached(url: string): Promise<CachedResponse | null> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  async setCached(url: string, data: unknown): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        store.put({ url, data, timestamp: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Silently fail — caching is best-effort
    }
  }

  async getAllCached(): Promise<CachedResponse[]> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async clearCache(): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Silently fail
    }
  }

  // ─── Queue operations (pending mutations) ───

  async addToQueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp' | 'retryCount'>): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('queue', 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.add({
        ...mutation,
        timestamp: Date.now(),
        retryCount: 0,
      });
      request.onsuccess = () => resolve(request.result as number);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getQueue(): Promise<QueuedMutation[]> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('queue', 'readonly');
        const store = tx.objectStore('queue');
        const request = store.getAll();
        request.onsuccess = () => {
          const items = (request.result || []) as QueuedMutation[];
          // Sort by timestamp (oldest first — preserve order)
          items.sort((a, b) => a.timestamp - b.timestamp);
          resolve(items);
        };
        request.onerror = () => reject(request.error);
      });
    } catch {
      return [];
    }
  }

  async removeFromQueue(id: number): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('queue', 'readwrite');
        const store = tx.objectStore('queue');
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Silently fail
    }
  }

  async updateRetryCount(id: number, retryCount: number): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('queue', 'readwrite');
        const store = tx.objectStore('queue');
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          const item = getRequest.result;
          if (item) {
            item.retryCount = retryCount;
            store.put(item);
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Silently fail
    }
  }

  async getQueueCount(): Promise<number> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('queue', 'readonly');
        const store = tx.objectStore('queue');
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return 0;
    }
  }
}

export const offlineDB = new OfflineDB();