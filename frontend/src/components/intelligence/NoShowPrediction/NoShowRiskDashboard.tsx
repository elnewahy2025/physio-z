// frontend/src/components/intelligence/NoShowPrediction/NoShowRiskDashboard.tsx
// I1: No-Show Risk Dashboard

import React, { useState, useEffect } from 'react';
import { noShowPredictionApi } from '../../lib/intelligence-api.js';

export const NoShowRiskDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await noShowPredictionApi.getUpcomingAppointmentsRisk();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800 dark:text-gray-200';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'LOW': return 'منخفض';
      case 'MEDIUM': return 'متوسط';
      case 'HIGH': return 'عالي';
      case 'CRITICAL': return 'حرج';
      default: return level;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const highRiskAppointments = data?.appointments?.filter(
    (apt: any) => apt.riskLevel === 'HIGH' || apt.riskLevel === 'CRITICAL'
  ) || [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">توقعات عدم الحضور</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            المواعيد القادمة مع تقييم مخاطر عدم الحضور
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          تحديث
        </button>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المواعيد</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.summary.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">مخاطر منخفضة</p>
            <p className="text-2xl font-bold text-green-800">{data.summary.low}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-700">مخاطر متوسطة</p>
            <p className="text-2xl font-bold text-yellow-800">{data.summary.medium}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-700">مخاطر عالية</p>
            <p className="text-2xl font-bold text-orange-800">{data.summary.high}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-700">مخاطر حرجة</p>
            <p className="text-2xl font-bold text-red-800">{data.summary.critical}</p>
          </div>
        </div>
      )}

      {/* High Risk Appointments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            مواعيد عالية المخاطر ({highRiskAppointments.length})
          </h3>
        </div>

        {highRiskAppointments.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            لا توجد مواعيد عالية المخاطر
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {highRiskAppointments.map((appointment: any) => (
              <div key={appointment.appointmentId} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(appointment.riskLevel)}`}>
                        {getRiskLabel(appointment.riskLevel)} ({appointment.riskScore})
                      </span>
                      <h4 className="ml-3 text-lg font-medium text-gray-900 dark:text-gray-100">
                        {appointment.patientName}
                      </h4>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(appointment.appointmentDate).toLocaleString('ar-EG')}
                    </p>

                    {/* Risk Factors */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">عدم حضور سابق:</p>
                        <p className="font-medium">{appointment.riskFactors.patientNoShowHistory}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">إلغاء سابق:</p>
                        <p className="font-medium">{appointment.riskFactors.patientCancellationHistory}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">عمر المريض:</p>
                        <p className="font-medium">{appointment.riskFactors.patientAge} سنة</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">رصيد مستحق:</p>
                        <p className="font-medium">{appointment.riskFactors.outstandingBalance} ج.م</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {appointment.recommendations?.length > 0 && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">التوصيات:</p>
                    <ul className="text-sm text-blue-700 list-disc list-inside">
                      {appointment.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Appointments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            جميع المواعيد القادمة
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  المريض
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الموعد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  درجة المخاطرة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  المستوى
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {data?.appointments?.map((appointment: any) => (
                <tr key={appointment.appointmentId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {appointment.patientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(appointment.appointmentDate).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {appointment.riskScore}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(appointment.riskLevel)}`}>
                      {getRiskLabel(appointment.riskLevel)}
                    </span>
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

export default NoShowRiskDashboard;
