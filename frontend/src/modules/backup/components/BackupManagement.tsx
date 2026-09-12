import React, { useState, useEffect } from 'react';
import { backupService } from '../services/backup.service';
import ConfirmModal from '../../../components/ConfirmModal';
import { useI18n } from '../../../i18n';

const BackupManagement: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [backups, setBackups] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [backupType, setBackupType] = useState<'FULL' | 'DATABASE_ONLY' | 'FILES_ONLY'>('FULL');
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    setLoading(true);
    try {
      const [history, stats] = await Promise.all([
        backupService.getBackupHistory(),
        backupService.getBackupStatistics(),
      ]);
      
      setBackups(history);
      setStatistics(stats);
    } catch (error) {
      console.error('Failed to load backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      await backupService.createBackup(backupType);
      await loadBackupData();
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backupId: string) => {
    try {
      const blob = await backupService.downloadBackup(backupId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${backupId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download backup:', error);
    }
  };


  const handleDelete = async () => {
    if (!backupToDelete) return;
    try {
      await backupService.deleteBackup(backupToDelete);
      await loadBackupData();
      setBackupToDelete(null);
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          {L('إدارة النسخ الاحتياطي للبيانات', 'Database & System Backups')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {L('إنشاء وتنزيل وإدارة النسخ الاحتياطية الآمنة لبيانات المركز والمرضى', 'Create, download, and manage encrypted system backups')}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-blue-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V9M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('إجمالي النسخ', 'Total Backups')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{statistics?.totalBackups || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-emerald-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('النسخ الناجحة', 'Successful Backups')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{statistics?.successfulBackups || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('النسخ الفاشلة', 'Failed Backups')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{statistics?.failedBackups || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 text-purple-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
                {L('الحجم الإجمالي', 'Total Storage Used')}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {formatSize(statistics?.totalSize || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Backup */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
          {L('إنشاء نسخة احتياطية جديدة', 'Create On-Demand Backup')}
        </h3>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={backupType}
            onChange={(e) => setBackupType(e.target.value as any)}
            className="border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-xs p-2.5"
          >
            <option value="FULL">{L('نسخة كاملة (قاعدة البيانات + الملفات)', 'Full Backup (Database + Files)')}</option>
            <option value="DATABASE_ONLY">{L('قاعدة البيانات فقط', 'Database Only')}</option>
            <option value="FILES_ONLY">{L('الملفات والمستندات فقط', 'Files Only')}</option>
          </select>
          
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 disabled:opacity-50 transition shadow-sm"
          >
            {creating ? L('جارٍ الإنشاء...', 'Creating Backup...') : L('إنشاء نسخة الآن', 'Create Backup Now')}
          </button>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            {L('سجل النسخ الاحتياطية السابقة', 'Backup History')}
          </h3>
        </div>
        
        {backups.length === 0 ? (
          <div className="p-8 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
            {L('لا توجد نسخ احتياطية مسجلة بعد', 'No backups created yet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/60">
                <tr>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {L('اسم الملف', 'Filename')}
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {L('النوع', 'Type')}
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {L('الحجم', 'Size')}
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {L('الحالة', 'Status')}
                  </th>
                  <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {L('التاريخ', 'Date')}
                  </th>
                  <th className="px-6 py-3.5 text-end text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {L('الإجراءات', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-medium text-gray-900 dark:text-gray-100">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {backup.type === 'FULL' ? L('كامل', 'Full') : 
                       backup.type === 'DATABASE_ONLY' ? L('قاعدة بيانات', 'Database') : L('ملفات', 'Files')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {formatSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        backup.status === 'SUCCESS' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300' :
                        backup.status === 'FAILED' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {backup.status === 'SUCCESS' ? L('ناجح', 'Success') :
                         backup.status === 'FAILED' ? L('فشل', 'Failed') : L('قيد المعالجة', 'In Progress')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {new Date(backup.createdAt).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-end text-xs font-semibold space-x-2 space-x-reverse">
                      {backup.status === 'SUCCESS' && (
                        <button
                          onClick={() => handleDownload(backup.id)}
                          className="text-primary-600 dark:text-primary-400 hover:underline px-1"
                        >
                          {L('تنزيل', 'Download')}
                        </button>
                      )}
                      <button
                        onClick={() => setBackupToDelete(backup.id)}
                        className="text-red-600 dark:text-red-400 hover:underline px-1"
                      >
                        {L('حذف', 'Delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!backupToDelete}
        onClose={() => setBackupToDelete(null)}
        onConfirm={handleDelete}
        title={L('حذف النسخة الاحتياطية', 'Delete Backup')}
        message={L('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ لا يمكن التراجع عن هذا الإجراء.', 'Are you sure you want to permanently delete this backup file?')}
        variant="danger"
      />
    </div>
  );
};

export default BackupManagement;
