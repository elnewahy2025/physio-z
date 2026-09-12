import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { treatmentEffectivenessService } from '../services/treatment-effectiveness.service';
import { useI18n } from '../../../i18n';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TreatmentEffectivenessDashboard: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    diagnosis: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await treatmentEffectivenessService.getTreatmentEffectiveness(
        filters.diagnosis ? { diagnosis: filters.diagnosis } : undefined
      );
      setData(result);
    } catch (error) {
      console.error('Failed to load treatment effectiveness data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const chartData = {
    labels: data?.byDiagnosis?.map((item: any) => item.diagnosis) || [],
    datasets: [
      {
        label: L('معدل النجاح (%)', 'Success Rate (%)'),
        data: data?.byDiagnosis?.map((item: any) => item.successRate) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: L('متوسط تقليل الألم (من 10)', 'Avg Pain Reduction (/10)'),
        data: data?.byDiagnosis?.map((item: any) => item.averagePainReduction) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: L('فعالية العلاج حسب التشخيص الطبي', 'Treatment Effectiveness by Diagnosis'),
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {L('تحليلات فعالية العلاج والنتائج السريرية', 'Treatment Effectiveness & Clinical Outcomes')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {L('قياس نسب التحسن، تراجع الألم، ومتوسط الجلسات المطلوبة لكل تشخيص', 'Measure recovery rates, pain reduction, and average sessions per condition')}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {L('التشخيص الطبي', 'Diagnosis')}
            </label>
            <input
              type="text"
              name="diagnosis"
              value={filters.diagnosis}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
              placeholder={L('أدخل التشخيص للبحث...', 'Enter diagnosis...')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {L('من تاريخ', 'From Date')}
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {L('إلى تاريخ', 'To Date')}
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-xs font-bold transition shadow-sm"
            >
              {L('تطبيق الفلاتر', 'Apply Filters')}
            </button>
          </div>
        </form>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-emerald-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('إجمالي المرضى', 'Total Patients')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{data?.overall?.totalPatients || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-blue-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('إجمالي الحالات', 'Total Diagnoses')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{data?.overall?.totalDiagnoses || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-yellow-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('متوسط معدل النجاح', 'Avg Success Rate')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {data?.overall?.averageSuccessRate?.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('متوسط تقليل الألم', 'Avg Pain Reduction')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {data?.overall?.averagePainReduction?.toFixed(1) || 0} / 10
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
        <div className="h-96">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {L('تفاصيل ومؤشرات فعالية العلاج', 'Treatment Effectiveness Details')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('التشخيص الطبي', 'Diagnosis')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('عدد المرضى', 'Patient Count')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('معدل النجاح', 'Success Rate')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('متوسط الجلسات', 'Avg Sessions')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('تقليل الألم', 'Pain Reduction')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {data?.byDiagnosis?.map((item: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 dark:text-gray-100">
                    {item.diagnosis}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {item.patientCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
                      {item.successRate?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {item.averageSessions?.toFixed(1)} {L('جلسة', 'sessions')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {item.averagePainReduction?.toFixed(1)} / 10
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TreatmentEffectivenessDashboard;
