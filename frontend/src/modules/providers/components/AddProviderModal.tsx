import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { providerService } from '../services/provider.service';

interface AddProviderModalProps {
  onClose: () => void;
  onProviderAdded: () => void;
}

const AddProviderModal: React.FC<AddProviderModalProps> = ({
  onClose,
  onProviderAdded,
}) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [providerName, setProviderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await providerService.getTemplates();
      setTemplates(response);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    try {
      const template = await providerService.getTemplate(templateId);
      setSelectedTemplate(template);
      setProviderName(template.name);
      
      // Initialize credentials state
      const credState: Record<string, string> = {};
      Object.entries(template.credentialsTemplate || {}).forEach(([key, field]: [string, any]) => {
        credState[key] = '';
      });
      setCredentials(credState);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate credentials
      const missingFields = Object.entries(selectedTemplate.credentialsTemplate)
        .filter(([key, field]: [string, any]) => field.required && !credentials[key])
        .map(([key]) => selectedTemplate.credentialsTemplate[key].label);

      if (missingFields.length > 0) {
        setError(`حقول مطلوبة: ${missingFields.join(', ')}`);
        return;
      }

      // Create provider from template
      await providerService.createFromTemplate(
        selectedTemplate.id,
        {
          name: providerName,
          credentials,
        }
      );

      onProviderAdded();
    } catch (error: any) {
      setError(error.response?.data?.message || 'فشل في إنشاء المزود');
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    EGYPTIAN_PAYMENTS: 'بوابات دفع مصرية',
    INTERNATIONAL_PAYMENTS: 'بوابات دفع دولية',
    WHATSAPP: 'واتساب',
    VIDEO: 'فيديو',
    SMS: 'رسائل نصية',
    EMAIL: 'بريد إلكتروني',
  };

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-50 dark:bg-gray-9000 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                إضافة مزود خدمة جديد
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-400"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-5 sm:p-6">
            {!selectedTemplate ? (
              /* Template Selection */
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    اختر قالب مزود الخدمة
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    اختر من القوالب الجاهزة أو أنشئ مزوداً مخصصاً
                  </p>
                </div>

                {Object.entries(groupedTemplates).map(([category, templates]) => (
                  <div key={category}>
                    <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
                      {categoryLabels[category] || category}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(templates as any[]).map((template: any) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className="text-right p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {template.name}
                              </h6>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {template.description}
                              </p>
                            </div>
                            {template.isPopular && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                                شائع
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Provider Configuration */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Info */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedTemplate.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate(null)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      تغيير القالب
                    </button>
                  </div>
                </div>

                {/* Provider Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    اسم المزود *
                  </label>
                  <input
                    type="text"
                    required
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder="مثال: واتساب الرئيسي"
                  />
                </div>

                {/* Credentials */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    بيانات الاعتماد
                  </h4>
                  <div className="space-y-4">
                    {Object.entries(selectedTemplate.credentialsTemplate).map(
                      ([key, field]: [string, any]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label} {field.required && '*'}
                          </label>
                          <input
                            type={field.type || 'text'}
                            required={field.required}
                            value={credentials[key] || ''}
                            onChange={(e) => handleCredentialChange(key, e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                            placeholder={field.description}
                          />
                          {field.description && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {field.description}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 space-x-reverse">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'جارٍ الإنشاء...' : 'إنشاء المزود'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProviderModal;
