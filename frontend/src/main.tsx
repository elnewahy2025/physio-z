// frontend/src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { offlineManager } from './lib/offline-manager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Keep previous data while refetching (smoother offline experience)
      placeholderData: (prev: unknown) => prev,
    },
  },
});

// Seed React Query cache from IndexedDB (offline persistence)
offlineManager
  .seedReactQueryCache((key, data) => {
    queryClient.setQueryData(key, data);
  })
  .catch(() => {
    // IndexedDB not available — continue normally
  });

// Initial sync attempt on app load
if (navigator.onLine) {
  offlineManager.sync();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);