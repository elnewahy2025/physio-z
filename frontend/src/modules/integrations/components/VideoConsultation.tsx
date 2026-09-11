import React, { useState, useEffect } from 'react';
import { VideoCameraIcon, LinkIcon } from '@heroicons/react/24/outline';
import { videoService } from '../services/video.service';

interface VideoConsultationProps {
  appointmentId: string;
}

const VideoConsultation: React.FC<VideoConsultationProps> = ({ appointmentId }) => {
  const [videoLinks, setVideoLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadVideoLinks();
  }, [appointmentId]);

  const loadVideoLinks = async () => {
    setLoading(true);
    try {
      const response = await videoService.getAppointmentVideoLinks(appointmentId);
      setVideoLinks(response);
    } catch (error) {
      console.error('Failed to load video links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideoLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await videoService.addVideoLink(appointmentId, {
        videoUrl: newVideoUrl,
        password: newPassword || undefined,
        notes: newNotes || undefined,
      });
      
      // Reset form
      setNewVideoUrl('');
      setNewPassword('');
      setNewNotes('');
      setShowAddForm(false);
      
      // Reload video links
      await loadVideoLinks();
    } catch (error) {
      console.error('Failed to add video link:', error);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'ZOOM':
        return '🎥';
      case 'GOOGLE_MEET':
        return '📹';
      case 'TEAMS':
        return '💼';
      default:
        return '🔗';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          استشارات الفيديو
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <VideoCameraIcon className="h-4 w-4 ml-1" />
          إضافة رابط
        </button>
      </div>

      {/* Add Video Link Form */}
      {showAddForm && (
        <form onSubmit={handleAddVideoLink} className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              رابط الفيديو *
            </label>
            <input
              type="url"
              required
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              placeholder="https://zoom.us/j/..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                كلمة المرور (اختياري)
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="كلمة مرور الاجتماع"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ملاحظات
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="ملاحظات..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
            >
              حفظ الرابط
            </button>
          </div>
        </form>
      )}

      {/* Video Links List */}
      {videoLinks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          لا توجد روابط فيديو
        </p>
      ) : (
        <div className="space-y-3">
          {videoLinks.map((video) => (
            <div key={video.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="text-2xl ml-2">{getPlatformIcon(video.platform)}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {video.platform === 'ZOOM' ? 'Zoom' :
                         video.platform === 'GOOGLE_MEET' ? 'Google Meet' :
                         video.platform === 'TEAMS' ? 'Microsoft Teams' : 'Platform'}
                      </p>
                      <p className="text-xs text-gray-500">
                        أضيف بواسطة {video.createdBy.name}
                      </p>
                    </div>
                  </div>
                  
                  {video.password && (
                    <p className="mt-2 text-sm text-gray-600">
                      كلمة المرور: {video.password}
                    </p>
                  )}
                  
                  {video.notes && (
                    <p className="mt-1 text-sm text-gray-500">
                      {video.notes}
                    </p>
                  )}
                </div>
                
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <LinkIcon className="h-4 w-4 ml-1" />
                  انضمام
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoConsultation;
