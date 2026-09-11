import React, { useState, useEffect } from 'react';
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { photoProgressService } from '../../services/photo-progress.service';

interface PhotoTimelineProps {
  patientId: string;
  onPhotoUpload?: () => void;
}

const PhotoTimeline: React.FC<PhotoTimelineProps> = ({ patientId, onPhotoUpload }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [patientId]);

  const loadPhotos = async () => {
    try {
      const response = await photoProgressService.getPhotoTimeline(patientId);
      setPhotos(response);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = () => {
    loadPhotos();
    setShowUpload(false);
    onPhotoUpload?.();
  };

  const handleDelete = async (photoId: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      try {
        await photoProgressService.deletePhoto(photoId);
        await loadPhotos();
      } catch (error) {
        console.error('Failed to delete photo:', error);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">جارٍ التحميل...</div>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">تتبع التقدم بالصور</h3>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <CameraIcon className="h-5 w-5 ms-2" />
          إضافة صورة
        </button>
      </div>

      {showUpload && (
        <PhotoUpload patientId={patientId} onUploadComplete={handlePhotoUpload} />
      )}

      {photos.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد صور بعد</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo: any) => (
            <div
              key={photo.id}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <img
                src={`data:image/jpeg;base64,${photo.thumbnailData}`}
                alt={photo.bodyPart || 'Progress photo'}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getPhotoTypeLabel(photo.photoType)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(photo.photoDate).toLocaleDateString('ar-EG')}
                    </p>
                    {photo.bodyPart && (
                      <p className="text-xs text-gray-400 mt-1">
                        {getBodyPartLabel(photo.bodyPart)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="text-red-600 hover:text-red-900"
                    title="حذف"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
                {photo.notes && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{photo.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getPhotoTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    before: 'قبل العلاج',
    during: 'أثناء العلاج',
    after: 'بعد العلاج',
  };
  return labels[type] || type;
};

const getBodyPartLabel = (part: string): string => {
  const labels: Record<string, string> = {
    full_body: 'الجسم كامل',
    head_neck: 'الرأس والرقبة',
    shoulder: 'الكتف',
    arm: 'الذراع',
    hand: 'اليد',
    chest: 'الصدر',
    back: 'الظهر',
    abdomen: 'البطن',
    hip: 'الورك',
    leg: 'الساق',
    knee: 'الركبة',
    foot: 'القدم',
  };
  return labels[part] || part;
};

export default PhotoTimeline;
