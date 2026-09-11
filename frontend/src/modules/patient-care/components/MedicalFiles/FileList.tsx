import React, { useState } from 'react';
import { DocumentIcon, DownloadIcon, TrashIcon } from '@heroicons/react/24/outline';
import { medicalFileService } from '../../services/medical-file.service';

interface FileListComponentProps {
  patientId: string;
  onFileDeleted?: () => void;
}

const FileList: React.FC<FileListComponentProps> = ({ patientId, onFileDeleted }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadFiles();
  }, [patientId]);

  const loadFiles = async () => {
    try {
      const response = await medicalFileService.getPatientFiles(patientId);
      setFiles(response);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const blob = await medicalFileService.downloadFile(fileId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'file';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      try {
        await medicalFileService.deleteFile(fileId);
        await loadFiles();
        onFileDeleted?.();
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      {files.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد ملفات طبية</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {files.map((file: any) => (
            <div key={file.id} className="py-4 flex items-center justify-between">
              <div className="flex items-center">
                <DocumentIcon className="h-8 w-8 text-gray-400" />
                <div className="ms-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {file.originalName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(file.createdAt).toLocaleDateString('ar-EG')} •{' '}
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handleDownload(file.id)}
                  className="text-primary-600 hover:text-primary-900"
                  title="تحميل"
                >
                  <DownloadIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="text-red-600 hover:text-red-900"
                  title="حذف"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileList;
