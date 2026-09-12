import React, { useState, useEffect } from 'react';
import {
  VideoCameraIcon,
  LinkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  PlusIcon,
  PencilSquareIcon,
  FunnelIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../../lib/api';

interface VideoConsultationProps {
  appointmentId?: string;
}

interface AppointmentVideoItem {
  id: string;
  dateTime: string;
  duration: number;
  status: string;
  videoLink?: string | null;
  patient: {
    id: string;
    name: string;
    phone?: string;
  };
  therapist: {
    id: string;
    name: string;
  };
  room?: {
    number: number;
    name?: string;
  } | null;
}

const VideoConsultation: React.FC<VideoConsultationProps> = ({ appointmentId }) => {
  const [appointments, setAppointments] = useState<AppointmentVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'has_link' | 'no_link'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal / inline editing state
  const [editingAppt, setEditingAppt] = useState<AppointmentVideoItem | null>(null);
  const [modalLink, setModalLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [appointmentId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAppointments = async () => {
    setLoading(true);
    try {
      if (appointmentId) {
        const res = await api.get(`/appointments/${appointmentId}`);
        setAppointments([res.data]);
      } else {
        // Fetch upcoming appointments
        const res = await api.get('/appointments', {
          params: {
            limit: 50,
            status: 'CONFIRMED',
          },
        });
        
        const allAppts: AppointmentVideoItem[] = res.data.data || [];
        // Sort by dateTime
        allAppts.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
        setAppointments(allAppts);
      }
    } catch (error) {
      console.error('Failed to load video appointments:', error);
      showToast('تعذر تحميل استشارات الفيديو');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('تم نسخ الرابط إلى الحافظة');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const openEditModal = (item: AppointmentVideoItem) => {
    setEditingAppt(item);
    setModalLink(item.videoLink || '');
  };

  const handleSaveVideoLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;

    setSaving(true);
    try {
      const trimmed = modalLink.trim();
      await api.put(`/appointments/${editingAppt.id}`, {
        videoLink: trimmed || null,
      });

      // Update locally
      setAppointments((prev) =>
        prev.map((app) =>
          app.id === editingAppt.id ? { ...app, videoLink: trimmed || null } : app
        )
      );

      showToast(trimmed ? 'تم تحديث رابط مكالمة الفيديو بنجاح' : 'تمت إزالة رابط الفيديو');
      setEditingAppt(null);
    } catch (err) {
      console.error('Failed to save video link:', err);
      showToast('فشل حفظ رابط الفيديو، يرجى التحقق من الرابط');
    } finally {
      setSaving(false);
    }
  };

  const detectPlatform = (url?: string | null) => {
    if (!url) return { name: 'لم يحدد', icon: '🔗', color: 'bg-gray-100 text-gray-700' };
    const lower = url.toLowerCase();
    if (lower.includes('zoom.us')) return { name: 'Zoom', icon: '🎥', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' };
    if (lower.includes('meet.google.com')) return { name: 'Google Meet', icon: '📹', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
    if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return { name: 'MS Teams', icon: '💼', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' };
    return { name: 'رابط مباشر', icon: '🌐', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' };
  };

  const filteredAppointments = appointments.filter((app) => {
    if (filter === 'has_link') return !!app.videoLink;
    if (filter === 'no_link') return !app.videoLink;
    return true;
  });

  const totalWithLinks = appointments.filter((a) => !!a.videoLink).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6" dir="rtl">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg bg-indigo-600 text-white text-sm font-medium animate-fade-in">
          <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-700 via-indigo-600 to-purple-700 p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider mb-2">
              <VideoCameraIcon className="w-4 h-4" />
              الاستشارات عن بُعد
            </div>
            <h1 className="text-2xl font-bold">جلسات واستشارات الفيديو (Online Telehealth)</h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
              إدارة روابط الجلسات عن بُعد (Zoom, Google Meet, Microsoft Teams). يمكنك لصق الرابط المباشر لكل جلسة ليتمكن المريض والمعالج من الانضمام بضغطة زر واحدة.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20">
            <div className="text-center">
              <span className="block text-2xl font-black">{totalWithLinks}</span>
              <span className="text-[11px] text-indigo-100">جلسات جاهزة</span>
            </div>
            <div className="h-8 w-px bg-white/20 mx-1" />
            <div className="text-center">
              <span className="block text-2xl font-black">{appointments.length}</span>
              <span className="text-[11px] text-indigo-100">إجمالي المواعيد</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls / Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">التصفية:</span>
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              الكل ({appointments.length})
            </button>
            <button
              onClick={() => setFilter('has_link')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'has_link'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              بها رابط فيديو ({totalWithLinks})
            </button>
            <button
              onClick={() => setFilter('no_link')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'no_link'
                  ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              بحاجة لرابط ({appointments.length - totalWithLinks})
            </button>
          </div>
        </div>

        <button
          onClick={loadAppointments}
          disabled={loading}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          تحديث القائمة
        </button>
      </div>

      {/* Appointments Grid / List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <VideoCameraIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">لا توجد مواعيد مطابقة</h3>
          <p className="text-sm text-gray-500 mt-1">يمكنك إضافة روابط فيديو للمواعيد عبر جدول المواعيد أو الضغط على تحديث.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map((item) => {
            const platform = detectPlatform(item.videoLink);
            const dateObj = new Date(item.dateTime);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top bar: Patient & Platform Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base flex-shrink-0">
                        {item.patient?.name?.charAt(0) || 'م'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {item.patient?.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400" dir="ltr">
                          {item.patient?.phone || 'بدون هاتف'}
                        </p>
                      </div>
                    </div>

                    {item.videoLink ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg ${platform.color}`}>
                        <span>{platform.icon}</span>
                        <span>{platform.name}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        بدون رابط
                      </span>
                    )}
                  </div>

                  {/* Details: Date, Therapist */}
                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-indigo-500" />
                      <span>{dateObj.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-indigo-500" />
                      <span>{dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} ({item.duration} دقيقة)</span>
                      <span>•</span>
                      <span>د. {item.therapist?.name}</span>
                    </div>
                  </div>

                  {/* Video Link display */}
                  {item.videoLink && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>رابط الاجتماع المباشر:</span>
                        <button
                          onClick={() => handleCopy(item.id, item.videoLink!)}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                        >
                          {copiedId === item.id ? (
                            <>
                              <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                              نسخ الرابط
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-900 p-2.5 rounded-xl text-xs text-gray-700 dark:text-gray-300 font-mono truncate border border-gray-200 dark:border-gray-700" dir="ltr">
                        {item.videoLink}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  {item.videoLink ? (
                    <>
                      <a
                        href={item.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        انضمام للجلسة الآن
                      </a>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        title="تعديل الرابط"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openEditModal(item)}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 transition"
                    >
                      <PlusIcon className="w-4 h-4" />
                      إضافة رابط اجتماع (Zoom / Meet)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Video Link Modal */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
              {editingAppt.videoLink ? 'تعديل رابط استشارة الفيديو' : 'إرفاق رابط فيديو للموعد'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              المريض: <strong className="text-gray-700 dark:text-gray-300">{editingAppt.patient.name}</strong> • المعالج: <strong className="text-gray-700 dark:text-gray-300">{editingAppt.therapist.name}</strong>
            </p>

            <form onSubmit={handleSaveVideoLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  رابط الاجتماع (Zoom, Google Meet, Teams)
                </label>
                <input
                  type="url"
                  value={modalLink}
                  onChange={(e) => setModalLink(e.target.value)}
                  placeholder="https://meet.google.com/... أو https://zoom.us/j/..."
                  className="w-full text-xs rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-3 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  امسح الرابط واضغط حفظ لإزالة رابط الفيديو من هذا الموعد.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAppt(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm disabled:opacity-50"
                >
                  {saving ? 'جارِ الحفظ...' : 'حفظ الرابط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoConsultation;
