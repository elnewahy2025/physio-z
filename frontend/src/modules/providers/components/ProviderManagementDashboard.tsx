import React, { useState, useEffect } from 'react';
import { PlusIcon, CogIcon } from '@heroicons/react/24/outline';
import { providerService } from '../services/provider.service';
import ProviderCard from './ProviderCard';
import AddProviderModal from './AddProviderModal';
import { useI18n } from '../../../i18n';

const ProviderManagementDashboard: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    loadProviders();
  }, [filterType]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await providerService.getAllProviders(
        filterType || undefined
      );
      setProviders(response);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (provider: any) => console.log('Edit', provider);
  const handleDelete = (provider: any) => console.log('Delete', provider);
  const handleTest = (provider: any) => console.log('Test', provider);

  const typeLabels: Record<string, { ar: string; en: string }> = {
    WHATSAPP: { ar: 'واتساب', en: 'WhatsApp' },
    PAYMENT: { ar: 'بوابات الدفع', en: 'Payment Gateways' },
    VIDEO: { ar: 'مكالمات الفيديو', en: 'Video / Telehealth' },
    SMS: { ar: 'الرسائل النصية SMS', en: 'SMS Gateway' },
    EMAIL: { ar: 'البريد الإلكتروني', en: 'Email Provider' },
    CUSTOM: { ar: 'مزود مخصص', en: 'Custom API' },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('إدارة مزودي الخدمات الخارجية', 'External Provider Management')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {L('إضافة وتكوين وبوابات الخدمات الخارجية المعتمدة بالمركز', 'Configure external communication and payment service integrations')}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-transparent text-xs font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          {L('إضافة مزود خدمة', 'Add Provider')}
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
        >
          <option value="">{L('جميع أنواع المزودين', 'All Provider Types')}</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {isRTL ? label.ar : label.en}
            </option>
          ))}
        </select>
      </div>

      {/* Providers Grid */}
      {providers.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {L('لا توجد مزودي خدمة مضافين', 'No External Providers Configured')}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {L('ابدأ بإضافة أول مزود خدمة للرسائل أو الدفع.', 'Start by adding your first provider integration.')}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            {L('إضافة مزود خدمة جديد', 'Add New Provider')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onEdit={() => handleEdit(provider)}
              onDelete={() => handleDelete(provider)}
              onTest={() => handleTest(provider)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddProviderModal
          onClose={() => setShowAddModal(false)}
          onProviderAdded={() => {
            setShowAddModal(false);
            loadProviders();
          }}
        />
      )}
    </div>
  );
};

export default ProviderManagementDashboard;
