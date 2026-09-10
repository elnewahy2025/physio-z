// frontend/src/components/OfflineIndicator.tsx
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useI18n } from '../i18n';

export default function OfflineIndicator() {
  const { lang } = useI18n();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
      <div className="flex items-center justify-center gap-2">
        <WifiOff size={16} />
        <span>
          {L(
            'أنت غير متصل — البيانات المخزنة مؤقتاً قد لا تكون محدثة',
            'You are offline — showing cached data',
          )}
        </span>
      </div>
    </div>
  );
}