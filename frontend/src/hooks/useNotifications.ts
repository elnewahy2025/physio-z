// frontend/src/hooks/useNotifications.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch notifications list
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications', { params: { limit: 20 } });
      return res.data;
    },
  });

  const notifications: Notification[] = data?.data || [];
  const unreadCount: number = data?.unreadCount || 0;

  // ─── SSE Connection ───
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const connect = () => {
      const eventSource = new EventSource(`/api/notifications/stream?token=${token}`, {
        withCredentials: true,
      });

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'CONNECTED') return;

          // New notification received
          setLatestNotification(data);

          // Update React Query cache
          queryClient.setQueryData(['notifications'], (old: any) => {
            if (!old) return { data: [data], unreadCount: 1 };
            return {
              ...old,
              data: [data, ...old.data],
              unreadCount: (old.unreadCount || 0) + 1,
            };
          });
        } catch {
          // Ignore malformed SSE data
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();

        // Reconnect after 5 seconds
        setTimeout(() => {
          if (localStorage.getItem('accessToken')) {
            connect();
          }
        }, 5000);
      };

      eventSourceRef.current = eventSource;
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
      setIsConnected(false);
    };
  }, [queryClient]);

  // ─── Mutations ───

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    latestNotification,
    markAsRead,
    markAllAsRead,
  };
}