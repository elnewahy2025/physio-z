import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { noShowPredictionService } from '../services/no-show-prediction.service';

const NoShowRiskDashboard: React.FC = () => {
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
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };
    
    const style = styles[riskLevel as keyof typeof styles] || styles.LOW;
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const highRiskAppointments = upcomingAppointments?.riskAssessments?.filter(
    (appointment: any) => appointment.riskLevel === 'HIGH' || appointment.riskLevel === 'CRITICAL'
  ) || [];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">إجمالي المواعيد القادمة</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {upcomingAppointments?.totalAppointments || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">مواعيد عالية الخطورة</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {upcomingAppointments?.highRiskAppointments || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">مواعيد حرجة</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {highRiskAppointments.filter((apt: any) => apt.riskLevel === 'CRITICAL').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Risk Appointments */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">مواعيد عالية الخطورة</h3>
          <button
            onClick={loadUpcomingAppointments}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
          >
            تحديث
          </button>
        </div>
        
        {highRiskAppointments.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            لا توجد مواعيد عالية الخطورة
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {highRiskAppointments.map((appointment: any) => (
              <div key={appointment.appointmentId} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getRiskIcon(appointment.riskLevel)}
                    <div className="mr-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {appointment.patientName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(appointment.appointmentDate).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        درجة الخطورة: {appointment.riskScore}
                      </p>
                      <span className={getRiskBadge(appointment.riskLevel)}>
                        {appointment.riskLevel === 'CRITICAL' ? 'حرج' : 
                         appointment.riskLevel === 'HIGH' ? 'عالي' : 'متوسط'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Risk Factors */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                
                {/* Recommendations */}
                {appointment.recommendations.length > 0 && (
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

      {/* All Appointments List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">جميع المواعيد القادمة</h3>
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
                  درجة الخطورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  المستوى
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  التوصيات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
              {upcomingAppointments?.riskAssessments?.map((appointment: any) => (
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
                    <span className={getRiskBadge(appointment.riskLevel)}>
                      {appointment.riskLevel === 'CRITICAL' ? 'حرج' : 
                       appointment.riskLevel === 'HIGH' ? 'عالي' : 
                       appointment.riskLevel === 'MEDIUM' ? 'متوسط' : 'منخفض'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {appointment.recommendations.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {appointment.recommendations.slice(0, 2).map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    ) : (
                      'لا توجد توصيات'
                    )}
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
