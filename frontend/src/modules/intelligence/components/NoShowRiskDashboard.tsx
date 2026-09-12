import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { noShowPredictionService } from '../services/no-show-prediction.service';
import { useI18n } from '../../../i18n';

const NoShowRiskDashboard: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [upcomingAppointments, setUpcomingAppointments] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingAppointments();
  }, []);

  const loadUpcomingAppointments = async () => {
    setLoading(true);
    try {
      const result = await noShowPredictionService.getUpcomingAppointmentsRisk();
      setUpcomingAppointments(result);
    } catch (error) {
      console.error('Failed to load upcoming appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'MEDIUM':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'HIGH':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'CRITICAL':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    const styles = {
      LOW: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      CRITICAL: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };
    
    const style = styles[riskLevel as keyof typeof styles] || styles.LOW;
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const highRiskAppointments = upcomingAppointments?.appointments?.filter(
    (a: any) => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL'
  ) || [];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {L('تحليلات مخاطر عدم الحضور (No-Show Prediction)', 'No-Show Risk Prediction')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {L('توقع المواعيد المعرضة للتغيب وإجراءات التدخل الاستباقية لتفادي إهدار وقت العيادات', 'Predict appointments at risk of no-show and take proactive actions')}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-blue-500">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('المواعيد القادمة المفحوصة', 'Evaluated Appointments')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{upcomingAppointments?.total || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-green-500">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('منخفضة الخطورة', 'Low Risk')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {upcomingAppointments?.appointments?.filter((a: any) => a.riskLevel === 'LOW').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-yellow-500">
              <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('متوسطة الخطورة', 'Medium Risk')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {upcomingAppointments?.appointments?.filter((a: any) => a.riskLevel === 'MEDIUM').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-red-500">
              <XCircleIcon className="h-6 w-6" />
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('عالية أو حرجة', 'High / Critical Risk')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{highRiskAppointments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Appointments */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {L('مواعيد عالية الخطورة بحاجة لمتابعة هاتفية أو واتساب', 'High Risk Appointments Needing Follow-up')}
          </h3>
          <button
            onClick={loadUpcomingAppointments}
            className="px-3 py-1.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-xs font-bold transition"
          >
            {L('تحديث', 'Refresh')}
          </button>
        </div>
        
        {highRiskAppointments.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
            {L('لا توجد مواعيد عالية الخطورة حالياً', 'No high risk appointments currently')}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {highRiskAppointments.map((appointment: any) => (
              <div key={appointment.appointmentId} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {getRiskIcon(appointment.riskLevel)}
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {appointment.patientName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                        {new Date(appointment.appointmentDate).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {L('درجة الخطورة', 'Risk Score')}: {appointment.riskScore}
                      </p>
                      <span className={getRiskBadge(appointment.riskLevel)}>
                        {appointment.riskLevel === 'CRITICAL' ? L('حرج', 'Critical') : 
                         appointment.riskLevel === 'HIGH' ? L('عالي', 'High') : L('متوسط', 'Medium')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Risk Factors */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{L('عدم حضور سابق:', 'No-Show History:')}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{appointment.riskFactors.patientNoShowHistory}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{L('إلغاء سابق:', 'Past Cancellations:')}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{appointment.riskFactors.patientCancellationHistory}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{L('عمر المريض:', 'Patient Age:')}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{appointment.riskFactors.patientAge} {L('سنة', 'yrs')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{L('رصيد مستحق:', 'Outstanding Balance:')}</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{appointment.riskFactors.outstandingBalance} EGP</p>
                  </div>
                </div>
                
                {/* Recommendations */}
                {appointment.recommendations && appointment.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {L('توصيات التدخل المقترحة:', 'Recommended Actions:')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {appointment.recommendations.map((rec: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        >
                          {rec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoShowRiskDashboard;
