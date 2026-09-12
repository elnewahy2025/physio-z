import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { auditService } from '../services/audit.service';
import { useI18n } from '../../../i18n';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AuditLogDashboard: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [logs, setLogs] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    category: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    loadAuditData();
  }, [pagination.page]);

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [stats, alerts] = await Promise.all([
        auditService.getAuditStatistics(),
        auditService.getSecurityAlerts(7),
      ]);
      
      setStatistics(stats);
      setSecurityAlerts(alerts);
      await loadAuditLogs();
    } catch (error) {
      console.error('Failed to load audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await auditService.getAuditLogs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setLogs(response.logs);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      const blob = await auditService.exportAuditLogs({
        ...filters,
        format: 'CSV',
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      INFO: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      WARNING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      ERROR: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      CRITICAL: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    };
    
    return badges[severity as keyof typeof badges] || badges.INFO;
  };

  const actionChartData = {
    labels: statistics?.byAction?.map((item: any) => item.action) || [],
    datasets: [
      {
        label: L('عدد العمليات', 'Operation Count'),
        data: statistics?.byAction?.map((item: any) => item.count) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const categoryChartData = {
    labels: statistics?.byCategory?.map((item: any) => item.category) || [],
    datasets: [
      {
        data: statistics?.byCategory?.map((item: any) => item.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
      },
    ],
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('سجل تدقيق النظام والامتثال الطبي', 'Audit Logs & HIPAA Compliance')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {L('تتبع جميع الأنشطة والعمليات في النظام للامتثال الطبي والرقابة الأمنية', 'Track all activities across the system for security and medical compliance')}
          </p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 transition shadow-sm"
        >
          {L('تصدير السجل (CSV)', 'Export Logs (CSV)')}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-blue-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('إجمالي العمليات', 'Total Operations')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{statistics?.totalLogs || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-yellow-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('التحذيرات', 'Warnings')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{statistics?.bySeverity?.WARNING || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('الأخطاء', 'Errors')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{statistics?.bySeverity?.ERROR || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-purple-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('حالات حرجة', 'Critical Events')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{statistics?.bySeverity?.CRITICAL || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {L('العملية', 'Operation')}
            </label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
            >
              <option value="">{L('الكل', 'All')}</option>
              <option value="CREATE">{L('إنشاء', 'Create')}</option>
              <option value="UPDATE">{L('تحديث', 'Update')}</option>
              <option value="DELETE">{L('حذف', 'Delete')}</option>
              <option value="LOGIN">{L('تسجيل دخول', 'Login')}</option>
              <option value="LOGIN_FAILED">{L('فشل تسجيل دخول', 'Failed Login')}</option>
              <option value="EXPORT">{L('تصدير', 'Export')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {L('الفئة', 'Category')}
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
            >
              <option value="">{L('الكل', 'All')}</option>
              <option value="PATIENT_DATA">{L('بيانات المرضى', 'Patient Data')}</option>
              <option value="MEDICAL_RECORDS">{L('السجلات الطبية', 'Medical Records')}</option>
              <option value="FINANCIAL">{L('مالية', 'Financial')}</option>
              <option value="APPOINTMENTS">{L('المواعيد', 'Appointments')}</option>
              <option value="USER_MANAGEMENT">{L('إدارة المستخدمين', 'User Management')}</option>
              <option value="SYSTEM">{L('النظام', 'System')}</option>
              <option value="SECURITY">{L('الأمان', 'Security')}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {L('الخطورة', 'Severity')}
            </label>
            <select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
            >
              <option value="">{L('الكل', 'All')}</option>
              <option value="INFO">{L('معلومة', 'Info')}</option>
              <option value="WARNING">{L('تحذير', 'Warning')}</option>
              <option value="ERROR">{L('خطأ', 'Error')}</option>
              <option value="CRITICAL">{L('حرج', 'Critical')}</option>
            </select>
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
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2"
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
              className="block w-full border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
            {L('العمليات حسب النوع', 'Operations by Action Type')}
          </h3>
          <div className="h-64">
            <Bar data={actionChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
            {L('العمليات حسب الفئة', 'Operations by Category')}
          </h3>
          <div className="h-64">
            <Doughnut data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-red-900 dark:text-red-200 mb-3">
            {L('تنبيهات أمنية (آخر 7 أيام)', 'Security Alerts (Last 7 Days)')}
          </h3>
          <div className="space-y-2">
            {securityAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-red-100 dark:border-red-900/20">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-xs text-gray-900 dark:text-gray-100">{alert.description}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(alert.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {L('سجل الأنشطة والعمليات', 'Activity & Audit Log Records')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/60">
              <tr>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('التاريخ والوقت', 'Timestamp')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('المستخدم', 'User')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('العملية', 'Action')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('الوصف', 'Description')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('الفئة', 'Category')}
                </th>
                <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {L('الخطورة', 'Severity')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {new Date(log.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        {log.user?.name || L('النظام', 'System')}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {log.user?.role || ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-900 dark:text-gray-100">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {log.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getSeverityBadge(log.severity)}`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 sm:px-6">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {L('عرض', 'Showing')}{' '}
            <span className="font-bold">{(pagination.page - 1) * pagination.limit + 1}</span>
            {' '}{L('إلى', 'to')}{' '}
            <span className="font-bold">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            {' '}{L('من', 'of')}{' '}
            <span className="font-bold">{pagination.total}</span>
            {' '}{L('سجل', 'records')}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {L('السابق', 'Previous')}
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            >
              {L('التالي', 'Next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogDashboard;
