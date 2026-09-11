import React, { useState, useEffect } from 'react';
import { PlusIcon, CogIcon, TrashIcon } from '@heroicons/react/24/outline';
import { providerService } from '../services/provider.service';
import ProviderCard from './ProviderCard';
import AddProviderModal from './AddProviderModal';

const ProviderManagementDashboard: React.FC = () => {
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

  const typeLabels: Record<string, string> = {
    WHATSAPP: 'واتساب',
    PAYMENT: 'بوابات الدفع',
    VIDEO: 'الفيديو',
    SMS: 'الرسائل النصية',
    EMAIL: 'البريد الإلكتروني',
    CUSTOM: 'مخصص',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            إدارة مزودي الخدمة
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            إضافة وتكوين مزودي الخدمات الخارجية
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 ml-2" />
          إضافة مزود خدمة
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4 space-x-reverse">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">جميع الأنواع</option>
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Providers Grid */}
      {providers.length === 0 ? (
        <div className="text-center py-12">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            لا توجد مزودي خدمة مضافين
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            ابدأ بإضافة مزود خدمة جديد
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 ml-2" />
            إضافة أول مزود خدمة
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

      {/* Add Provider Modal */}
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
