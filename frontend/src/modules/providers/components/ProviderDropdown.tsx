import React, { useState, useEffect } from 'react';
import { providerService } from '../services/provider.service';

interface ProviderDropdownProps {
  providerType: string;
  value?: string;
  onChange: (providerId: string) => void;
  label?: string;
  placeholder?: string;
}

const ProviderDropdown: React.FC<ProviderDropdownProps> = ({
  providerType,
  value,
  onChange,
  label,
  placeholder = 'اختر مزود الخدمة',
}) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, [providerType]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const response = await providerService.getAllProviders(providerType);
      setProviders(response);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading || providers.length === 0}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
      >
        <option value="">{placeholder}</option>
        {providers.map((provider) => (
          <option key={provider.id} value={provider.id}>
            {provider.name}
            {provider.isDefault ? ' (افتراضي)' : ''}
          </option>
        ))}
      </select>
      
      {providers.length === 0 && !loading && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          لا توجد مزودي خدمة {providerType} مضافين. 
          <a href="/settings/providers" className="text-primary-600 hover:text-primary-700">
            إضافة مزود خدمة
          </a>
        </p>
      )}
    </div>
  );
};

export default ProviderDropdown;
