// frontend/src/lib/offline-manager.ts
// Manages offline detection, mutation queuing, and background sync.

import axios from 'axios';
import { offlineDB, type QueuedMutation } from './offline-db';

type SyncStatusCallback = (status: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  lastSyncResult: 'success' | 'partial' | 'failed' | null;
}) => void;

class OfflineManager {
  private listeners: Set<SyncStatusCallback> = new Set();
  private isSyncing = false;
  private lastSyncTime: number | null = null;
  private lastSyncResult: 'success' | 'partial' | 'failed' | null = null;
  private pendingCount = 0;

  private status: SyncStatusCallback extends (status: infer S) => void ? S : never = {
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastSyncResult: null,
  } as any;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateStatus({ isOnline: true });
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.updateStatus({ isOnline: false });
    });

    // Initial count
    this.refreshPendingCount();

    // Auto-sync every 30 seconds when online
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync();
      }
    }, 30000);
  }

  // ─── Public API ───

  onStatusChange(callback: SyncStatusCallback): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.getStatus());
    return () => this.listeners.delete(callback);
  }

  getStatus() {
    return {
      isOnline: navigator.onLine,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      lastSyncTime: this.lastSyncTime,
      lastSyncResult: this.lastSyncResult,
    };
  }

  isOnline(): boolean {
    return navigator.onLine;
  }

  // ─── Queue management ───

  async queueMutation(
    method: QueuedMutation['method'],
    url: string,
    body: unknown,
    description?: string,
  ): Promise<void> {
    await offlineDB.addToQueue({ method, url, body, description });
    await this.refreshPendingCount();
  }

  async refreshPendingCount(): Promise<void> {
    this.pendingCount = await offlineDB.getQueueCount();
    this.updateStatus({ pendingCount: this.pendingCount });
  }

  // ─── Sync ───

  async sync(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    const queue = await offlineDB.getQueue();
    if (queue.length === 0) {
      return; // Do nothing if queue is empty (prevents mass query invalidation every 30s)
    }

    this.isSyncing = true;
    this.updateStatus({ isSyncing: true });

    let successCount = 0;
    let failCount = 0;

    for (const mutation of queue) {
      if (!mutation.id) continue;

      try {
        // Get the current auth token
        const token = localStorage.getItem('accessToken');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Replay the request
        await axios({
          method: mutation.method,
          url: `/api${mutation.url.replace('/api', '')}`,
          data: mutation.body,
          headers,
          timeout: 10000,
        });

        // Success — remove from queue
        await offlineDB.removeFromQueue(mutation.id);
        successCount++;
      } catch (error: any) {
        // Check if it's a permanent failure (4xx) vs temporary (network/5xx)
        const isPermanent = error.response && error.response.status >= 400 && error.response.status < 500;

        if (isPermanent || mutation.retryCount >= 3) {
          // Give up after 3 retries or permanent failure
          await offlineDB.removeFromQueue(mutation.id);
          failCount++;
          console.warn(
            `Offline sync: dropped mutation ${mutation.method} ${mutation.url} (${mutation.description || 'no description'})`,
            error.response?.data || error.message,
          );
        } else {
          // Increment retry count, keep in queue
          await offlineDB.updateRetryCount(mutation.id, mutation.retryCount + 1);
        }
      }
    }

    this.isSyncing = false;
    this.lastSyncTime = Date.now();
    this.lastSyncResult =
      failCount === 0 ? 'success' : successCount > 0 ? 'partial' : 'failed';

    await this.refreshPendingCount();
    this.updateStatus({
      isSyncing: false,
      lastSyncTime: this.lastSyncTime,
      lastSyncResult: this.lastSyncResult,
    });
  }

  // ─── Cache helpers ───

  async cacheResponse(url: string, data: unknown): Promise<void> {
    await offlineDB.setCached(url, data);
  }

  async getCachedResponse(url: string): Promise<unknown | null> {
    const cached = await offlineDB.getCached(url);
    if (!cached) return null;

    // Check freshness (cache expires after 1 hour)
    const CACHE_TTL = 60 * 60 * 1000;
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      return null; // Stale
    }

    return cached.data;
  }

  async seedReactQueryCache(
    setQueryData: (key: string[], data: unknown) => void,
  ): Promise<void> {
    const all = await offlineDB.getAllCached();

    for (const entry of all) {
      // Convert URL back to React Query key
      // /api/appointments?date=2026-09-10 → ['appointments', '2026-09-10']
      const url = entry.url.replace('/api', '');
      const [path] = url.split('?');
      const parts = path.split('/').filter(Boolean);
      const key = parts;

      if (key.length > 0) {
        setQueryData(key, entry.data);
      }
    }
  }

  // ─── Internal ───

  private updateStatus(partial: Partial<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTime: number | null;
    lastSyncResult: 'success' | 'partial' | 'failed' | null;
  }>) {
    this.status = { ...this.status, ...partial };
    this.listeners.forEach((callback) => callback(this.getStatus()));
  }
}

export const offlineManager = new OfflineManager();
