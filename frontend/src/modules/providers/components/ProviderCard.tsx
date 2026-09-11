import React from 'react';
import { CogIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';

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
  const typeLabels: Record<string, string> = {
    WHATSAPP: 'واتساب',
    PAYMENT: 'بوابة دفع',
    VIDEO: 'فيديو',
    SMS: 'رسائل نصية',
    EMAIL: 'بريد إلكتروني',
    CUSTOM: 'مخصص',
  };

  const typeColors: Record<string, string> = {
    WHATSAPP: 'bg-green-100 text-green-800',
    PAYMENT: 'bg-blue-100 text-blue-800',
    VIDEO: 'bg-purple-100 text-purple-800',
    SMS: 'bg-yellow-100 text-yellow-800',
    EMAIL: 'bg-red-100 text-red-800',
    CUSTOM: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[provider.providerType]}`}>
              {typeLabels[provider.providerType]}
            </div>
            {provider.isDefault && (
              <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                افتراضي
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              onClick={onTest}
              className="text-gray-400 hover:text-gray-500"
              title="اختبار الاتصال"
            >
              <BeakerIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onEdit}
              className="text-gray-400 hover:text-gray-500"
              title="تعديل"
            >
              <CogIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-500"
              title="حذف"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <h3 className="mt-4 text-lg font-medium text-gray-900">
          {provider.name}
        </h3>
        
        {provider.description && (
          <p className="mt-1 text-sm text-gray-500">
            {provider.description}
          </p>
        )}

        {/* Capabilities */}
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">
            القدرات:
          </p>
          <div className="flex flex-wrap gap-1">
            {provider.capabilities?.map((cap: any) => (
              <span
                key={cap.capability}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
              >
                {cap.name}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span>
            طلبات: {provider.totalRequests}
          </span>
          <span>
            نسبة النجاح: {provider.totalRequests > 0 
              ? Math.round((provider.successfulRequests / provider.totalRequests) * 100)
              : 0}%
          </span>
        </div>

        {/* Test Status */}
        {provider.lastTestedAt && (
          <div className="mt-2 flex items-center text-xs">
            {provider.lastTestSuccess ? (
              <span className="text-green-600">✓ آخر اختبار ناجح</span>
            ) : (
              <span className="text-red-600">✗ آخر اختبار فاشل</span>
            )}
            <span className="text-gray-400 mr-1">
              ({new Date(provider.lastTestedAt).toLocaleDateString('ar-EG')})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderCard;
