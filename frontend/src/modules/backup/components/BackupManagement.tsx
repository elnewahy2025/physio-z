import React, { useState, useEffect } from 'react';
import { backupService } from '../services/backup.service';
import ConfirmModal from '../../../components/ConfirmModal';

const BackupManagement: React.FC = () => {
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

  const handleDelete = (backupId: string) => {
    setBackupToDelete(backupId);
  };

  const confirmDelete = async () => {
    if (backupToDelete) {
      try {
        await backupService.deleteBackup(backupToDelete);
        await loadBackupData();
      } catch (error) {
        console.error('Failed to delete backup:', error);
      } finally {
        setBackupToDelete(null);
      }
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-gray-100 text-gray-800 dark:text-gray-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-yellow-100 text-yellow-800',
    };
    
    const labels = {
      PENDING: 'في الانتظار',
      IN_PROGRESS: 'قيد التنفيذ',
      COMPLETED: 'مكتملة',
      FAILED: 'فشلت',
      CANCELLED: 'ملغاة',
    };
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.PENDING}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">إدارة النسخ الاحتياطية</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          إنشاء وإدارة النسخ الاحتياطية للبيانات
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V9M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">إجمالي النسخ</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{statistics?.totalBackups || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">نسخ ناجحة</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{statistics?.successfulBackups || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">نسخ فاشلة</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{statistics?.failedBackups || 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V9M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div className="mr-5">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">الحجم الإجمالي</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatSize(statistics?.totalSize || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Backup */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">إنشاء نسخة احتياطية</h3>
        <div className="flex items-center space-x-4 space-x-reverse">
          <select
            value={backupType}
            onChange={(e) => setBackupType(e.target.value as any)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="FULL">نسخة كاملة (قاعدة البيانات + الملفات)</option>
            <option value="DATABASE_ONLY">قاعدة البيانات فقط</option>
            <option value="FILES_ONLY">الملفات فقط</option>
          </select>
          
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {creating ? 'جارٍ الإنشاء...' : 'إنشاء نسخة احتياطية'}
          </button>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">سجل النسخ الاحتياطية</h3>
        </div>
        
        {backups.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            لا توجد نسخ احتياطية بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    اسم الملف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    النوع
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الحجم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {backup.filename}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {backup.type === 'FULL' ? 'كامل' : 
                       backup.type === 'DATABASE_ONLY' ? 'قاعدة بيانات' : 'ملفات'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(backup.status)}>
                        {backup.status === 'COMPLETED' ? 'مكتملة' : 
                         backup.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 
                         backup.status === 'FAILED' ? 'فشلت' : 'في الانتظار'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(backup.createdAt).toLocaleString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownload(backup.id)}
                        className="text-primary-600 hover:text-primary-900 ml-3"
                        disabled={backup.status !== 'COMPLETED'}
                      >
                        تحميل
                      </button>
                      <button
                        onClick={() => handleDelete(backup.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        حذف
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
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذه النسخة الاحتياطية؟"
      />
    </div>
  );
};

export default BackupManagement;
