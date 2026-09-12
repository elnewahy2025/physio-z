import React from 'react';
import { CogIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { useI18n } from '../../../i18n';

interface ProviderCardProps {
  provider: any;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onEdit,
  onDelete,
  onTest,
}) => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const typeLabels: Record<string, { ar: string; en: string }> = {
    WHATSAPP: { ar: 'واتساب', en: 'WhatsApp' },
    PAYMENT: { ar: 'بوابة دفع', en: 'Payment Gateway' },
    VIDEO: { ar: 'مكالمات فيديو', en: 'Video / Telehealth' },
    SMS: { ar: 'رسائل نصية SMS', en: 'SMS' },
    EMAIL: { ar: 'بريد إلكتروني', en: 'Email' },
    CUSTOM: { ar: 'مخصص', en: 'Custom API' },
  };

  const typeColors: Record<string, string> = {
    WHATSAPP: 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300',
    PAYMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    VIDEO: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    SMS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300',
    EMAIL: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    CUSTOM: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl transition hover:shadow-md">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${typeColors[provider.providerType] || typeColors.CUSTOM}`}>
              {typeLabels[provider.providerType] ? (isRTL ? typeLabels[provider.providerType].ar : typeLabels[provider.providerType].en) : provider.providerType}
            </div>
            {provider.isDefault && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                {L('افتراضي', 'Default')}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onTest}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title={L('اختبار الاتصال', 'Test Connection')}
            >
              <BeakerIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title={L('تعديل', 'Edit')}
            >
              <CogIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
              title={L('حذف', 'Delete')}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-gray-100">
          {provider.name}
        </h3>
        
        {provider.description && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {provider.description}
          </p>
        )}

        {/* Capabilities */}
        {provider.capabilities && provider.capabilities.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              {L('القدرات المدعومة:', 'Capabilities:')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {provider.capabilities.map((cap: any) => (
                <span
                  key={cap.capability}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {cap.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {L('الطلبات', 'Requests')}: <strong className="text-gray-700 dark:text-gray-300">{provider.totalRequests || 0}</strong>
          </span>
          <span>
            {L('نسبة النجاح', 'Success')}: <strong className="text-gray-700 dark:text-gray-300">{provider.totalRequests > 0 
              ? Math.round((provider.successfulRequests / provider.totalRequests) * 100)
              : 0}%</strong>
          </span>
        </div>

        {/* Test Status */}
        {provider.lastTestedAt && (
          <div className="mt-2 flex items-center text-xs">
            {provider.lastTestSuccess ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{L('✓ تم اختبار الاتصال بنجاح', '✓ Connection verified')}</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-semibold">{L('✗ تعذر الاتصال بالمزود', '✗ Connection failed')}</span>
            )}
            <span className="text-gray-400 font-mono text-[11px] mx-1">
              ({new Date(provider.lastTestedAt).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderCard;
