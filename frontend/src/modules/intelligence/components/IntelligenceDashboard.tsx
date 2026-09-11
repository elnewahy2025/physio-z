import React, { useState } from 'react';
import TreatmentEffectivenessDashboard from './TreatmentEffectivenessDashboard';
import NoShowRiskDashboard from './NoShowRiskDashboard';
import DemandForecastDashboard from './DemandForecastDashboard';

type IntelligenceTab = 'treatment' | 'no-show' | 'demand';

const IntelligenceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>('treatment');

  const tabs = [
    { id: 'treatment', label: 'فعالية العلاج', icon: '🏥' },
    { id: 'no-show', label: 'توقع عدم الحضور', icon: '⚠️' },
    { id: 'demand', label: 'توقعات الطلب', icon: '📊' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">لوحة الذكاء الاصطناعي</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          تحليلات ذكية لتحسين فعالية العلاج وإدارة المواعيد
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as IntelligenceTab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
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
