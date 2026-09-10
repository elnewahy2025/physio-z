// frontend/src/hooks/useOfflineSync.ts
import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { offlineManager } from '../lib/offline-manager';

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  lastSyncResult: 'success' | 'partial' | 'failed' | null;
}

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<OfflineSyncState>(
    offlineManager.getStatus(),
  );

  useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange((status) => {
      setState(status);

      // When sync completes, invalidate all queries to refresh data
      if (!status.isSyncing && status.lastSyncResult === 'success') {
        queryClient.invalidateQueries();
      }
    });

    return unsubscribe;
  }, [queryClient]);

  const triggerSync = useCallback(() => {
    offlineManager.sync();
  }, []);

  return {
    ...state,
    triggerSync,
  };
}