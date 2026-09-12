import React, { useState } from 'react';
import TreatmentEffectivenessDashboard from './TreatmentEffectivenessDashboard';
import NoShowRiskDashboard from './NoShowRiskDashboard';
import DemandForecastDashboard from './DemandForecastDashboard';
import { useI18n } from '../../../i18n';

type IntelligenceTab = 'treatment' | 'no-show' | 'demand';

const IntelligenceDashboard: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [activeTab, setActiveTab] = useState<IntelligenceTab>('treatment');

  const tabs = [
    { id: 'treatment', label: L('فعالية العلاج والنتائج', 'Treatment Effectiveness'), icon: '🏥' },
    { id: 'no-show', label: L('توقع مخاطر عدم الحضور', 'No-Show Prediction'), icon: '⚠️' },
    { id: 'demand', label: L('توقعات الطلب والمواعيد', 'Demand Forecasting'), icon: '📊' },
  ];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {L('لوحة الذكاء السريري والاصطناعي', 'Clinical Intelligence Dashboard')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {L('تحليلات تنبؤية متقدمة لقياس جودة الرعاية وإدارة السعة الاستيعابية للمركز', 'Advanced predictive analytics to optimize care quality and clinic capacity')}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as IntelligenceTab)}
              className={`
                whitespace-nowrap py-4 px-2 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition
                ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'treatment' && <TreatmentEffectivenessDashboard />}
        {activeTab === 'no-show' && <NoShowRiskDashboard />}
        {activeTab === 'demand' && <DemandForecastDashboard />}
      </div>
    </div>
  );
};

export default IntelligenceDashboard;
