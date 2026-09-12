import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, XCircle } from 'lucide-react';
import { medicalFileService } from '../../services/medical-file.service';

interface FileUploadProps {
  patientId: string;
  onUploadComplete?: (file: any) => void;
  allowedCategories?: string[];
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  patientId,
  onUploadComplete,
  allowedCategories = ['xray', 'mri', 'ct_scan', 'referral', 'lab_report', 'doctor_note', 'other'],
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('other');

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);
      setError(null);

      for (const file of acceptedFiles) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('patientId', patientId);
          formData.append('category', selectedCategory);

          const response = await medicalFileService.uploadMedicalFile(formData);
          onUploadComplete?.(response);
        } catch (err: any) {
          setError(err.response?.data?.message || 'فشل رفع الملف');
        }
      }

      setUploading(false);
    },
    [patientId, selectedCategory, onUploadComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'application/dicom': ['.dcm'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    disabled,
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* Category Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          نوع الملف
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          dir="rtl"
        >
          {allowedCategories.map((category) => (
            <option key={category} value={category}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isDragActive ? (
            'أسحب الملفات هنا...'
          ) : (
            <>
              <span className="font-medium text-primary-600">اضغط للرفع</span> أو اسحب وأفلت
              <br />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                JPEG, PNG, PDF, DICOM حتى 10MB
              </span>
            </>
          )}
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <span className="ms-2 text-sm text-blue-700 dark:text-blue-300">جارٍ رفع الملفات...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400 dark:text-red-500" />
            <div className="ms-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">خطأ في الرفع</h3>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    xray: 'أشعة سينية',
    mri: 'رنين مغناطيسي',
    ct_scan: 'أشعة مقطعية',
    referral: 'تحويل طبي',
    lab_report: 'تقرير مختبر',
    doctor_note: 'ملاحظات طبيب',
    other: 'أخرى',
  };
  return labels[category] || category;
};

export default FileUpload;
