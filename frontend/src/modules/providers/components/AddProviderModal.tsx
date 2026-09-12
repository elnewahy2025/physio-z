import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { providerService } from '../services/provider.service';
import { useI18n } from '../../../i18n';

interface AddProviderModalProps {
  onClose: () => void;
  onProviderAdded: () => void;
}

const AddProviderModal: React.FC<AddProviderModalProps> = ({
  onClose,
  onProviderAdded,
}) => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

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
      Object.entries(template.credentialsTemplate || {}).forEach(([key]: [string, any]) => {
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
        setError(`${L('حقول مطلوبة:', 'Required fields:')} ${missingFields.join(', ')}`);
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
      setError(error.response?.data?.message || L('فشل في إنشاء المزود', 'Failed to create provider'));
    } finally {
      setLoading(false);
    }
  };

  const categoryLabels: Record<string, { ar: string; en: string }> = {
    EGYPTIAN_PAYMENTS: { ar: 'بوابات دفع مصرية', en: 'Egyptian Payment Gateways' },
    INTERNATIONAL_PAYMENTS: { ar: 'بوابات دفع دولية', en: 'International Gateways' },
    WHATSAPP: { ar: 'واتساب', en: 'WhatsApp' },
    VIDEO: { ar: 'مكالمات فيديو', en: 'Video / Telehealth' },
    SMS: { ar: 'رسائل نصية SMS', en: 'SMS' },
    EMAIL: { ar: 'بريد إلكتروني', en: 'Email' },
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
    <div className="fixed inset-0 z-50 overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-3xl text-start overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {L('إضافة مزود خدمة وتكامل جديد', 'Add External Provider Integration')}
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!selectedTemplate ? (
              /* Template Selection */
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {L('اختر قالب مزود الخدمة', 'Select Provider Template')}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {L('اختر من القوالب المعرفة مسبقاً (Fawry, InstaPay, Stripe, Twilio) لتسريع الإعداد', 'Choose from preconfigured integration templates to start quickly')}
                  </p>
                </div>

                {Object.entries(groupedTemplates).map(([category, catTemplates]) => (
                  <div key={category} className="space-y-3">
                    <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {categoryLabels[category] ? (isRTL ? categoryLabels[category].ar : categoryLabels[category].en) : category}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(catTemplates as any[]).map((template: any) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className="text-start p-4 border border-gray-200 dark:border-gray-700 rounded-2xl hover:border-primary-500 dark:hover:border-primary-500 bg-white dark:bg-gray-800 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all shadow-sm group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h6 className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition">
                                {template.name}
                              </h6>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                            {template.isPopular && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-100 text-primary-800 dark:bg-primary-950/50 dark:text-primary-300">
                                {L('شائع', 'Popular')}
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
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Template Info */}
                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {selectedTemplate.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {L('تغيير القالب', 'Change Template')}
                  </button>
                </div>

                {/* Provider Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    {L('اسم المزود أو بوابة الربط *', 'Integration / Provider Name *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 focus:ring-primary-500 focus:border-primary-500"
                    placeholder={L('مثال: واتساب العيادة الرئيسي', 'e.g. Primary Clinic WhatsApp')}
                  />
                </div>

                {/* Credentials */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {L('بيانات الاعتماد والمفاتيح السرية', 'Credentials & Secret Keys')}
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(selectedTemplate.credentialsTemplate).map(
                      ([key, field]: [string, any]) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {field.label} {field.required && '*'}
                          </label>
                          <input
                            type={field.type || 'text'}
                            required={field.required}
                            value={credentials[key] || ''}
                            onChange={(e) => handleCredentialChange(key, e.target.value)}
                            className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 focus:ring-primary-500 focus:border-primary-500"
                            placeholder={field.description}
                          />
                          {field.description && (
                            <p className="mt-1 text-[11px] text-gray-400">
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
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl p-3">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    {L('إلغاء', 'Cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50 shadow-sm"
                  >
                    {loading ? L('جارٍ الحفظ...', 'Creating...') : L('إنشاء المزود', 'Create Provider')}
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
