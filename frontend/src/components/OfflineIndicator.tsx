// frontend/src/components/OfflineIndicator.tsx
import { WifiOff, RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useI18n } from '../i18n';

export default function OfflineIndicator() {
  const { lang } = useI18n();
  const { isOnline, isSyncing, pendingCount, lastSyncTime, lastSyncResult, triggerSync } =
    useOfflineSync();

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Don't show if online, no pending items, and no sync issues
  if (isOnline && pendingCount === 0 && lastSyncResult !== 'partial' && lastSyncResult !== 'failed') {
    return null;
  }

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md">
          <div className="flex items-center justify-center gap-2">
            <WifiOff size={16} />
            <span>
              {L(
                'أنت غير متصل — البيانات المحفوظة محلياً قد لا تكون محدثة',
                'You are offline — showing saved data',
              )}
            </span>
          </div>
        </div>
      )}

      {/* Sync status toast */}
      {isOnline && (isSyncing || pendingCount > 0 || lastSyncResult === 'failed' || lastSyncResult === 'partial') && (
        <div className="fixed bottom-4 inset-x-4 z-[60] mx-auto max-w-md">
          <div
            className={`
            rounded-xl border p-4 shadow-lg
            ${
              isSyncing
                ? 'border-blue-200 bg-blue-50'
                : lastSyncResult === 'failed'
                  ? 'border-red-200 bg-red-50'
                  : lastSyncResult === 'partial'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-green-200 bg-green-50'
            }
          `}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {isSyncing ? (
                  <RefreshCw size={20} className="animate-spin text-blue-600" />
                ) : lastSyncResult === 'failed' ? (
                  <AlertTriangle size={20} className="text-red-600" />
                ) : lastSyncResult === 'partial' ? (
                  <AlertTriangle size={20} className="text-amber-600" />
                ) : (
                  <CheckCircle size={20} className="text-green-600" />
                )}

                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isSyncing
                        ? 'text-blue-900'
                        : lastSyncResult === 'failed'
                          ? 'text-red-900'
                          : lastSyncResult === 'partial'
                            ? 'text-amber-900'
                            : 'text-green-900'
                    }`}
                  >
                    {isSyncing
                      ? L('جاري المزامنة...', 'Syncing...')
                      : pendingCount > 0
                        ? L(`${pendingCount} ${pendingCount === 1 ? 'عنصر' : 'عناصر'} في انتظار المزامنة`, `${pendingCount} ${pendingCount === 1 ? 'item' : 'items'} pending sync`)
                        : lastSyncResult === 'failed'
                          ? L('فشلت المزامنة — بعض البيانات لم تُرسل', 'Sync failed — some data was not sent')
                          : lastSyncResult === 'partial'
                            ? L('اكتملت المزامنة جزئياً', 'Sync partially completed')
                            : L('تمت المزامنة بنجاح', 'Sync complete')}
                  </p>

                  {lastSyncTime && !isSyncing && pendingCount === 0 && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      {L(
                        `آخر مزامنة: ${new Date(lastSyncTime).toLocaleTimeString('ar-EG')}`,
                        `Last sync: ${new Date(lastSyncTime).toLocaleTimeString()}`,
                      )}
                    </p>
                  )}
                </div>
              </div>

              {isOnline && pendingCount > 0 && !isSyncing && (
                <button
                  onClick={triggerSync}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700"
                >
                  {L('مزامنة الآن', 'Sync Now')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}