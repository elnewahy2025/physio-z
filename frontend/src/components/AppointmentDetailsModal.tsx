import { useState } from 'react';
import {
  X,
  Clock,
  User,
  Phone,
  MapPin,
  AlignLeft,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Video,
  ExternalLink,
  Edit2,
  Check,
} from 'lucide-react';
import { useI18n } from '../i18n';
import type { Appointment } from '../types';
import { Badge } from './ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  onClose: () => void;
  canEdit?: boolean;
}

export function AppointmentDetailsModal({
  appointment,
  onClose,
  canEdit = true,
}: AppointmentDetailsModalProps) {
  const { t, lang } = useI18n();
  const isRTL = lang === 'ar';
  const queryClient = useQueryClient();

  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [videoLinkInput, setVideoLinkInput] = useState(appointment.videoLink || '');

  const changeStatus = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/appointments/${appointment.id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      onClose();
    },
  });

  const updateVideoLink = useMutation({
    mutationFn: async (link: string) => {
      await api.put(`/appointments/${appointment.id}`, {
        videoLink: link.trim() ? link.trim() : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-appointments'] });
      setIsEditingVideo(false);
    },
  });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
  };

  const currentVideoLink = appointment.videoLink;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isRTL ? 'تفاصيل الموعد' : 'Appointment Details'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <Badge status={appointment.status}>
              {statusLabels[appointment.status] || appointment.status}
            </Badge>

            {/* Quick Action: Join Call if link exists */}
            {currentVideoLink && (
              <a
                href={currentVideoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <Video size={14} />
                {isRTL ? 'انضمام للمكالمة' : 'Join Video Call'}
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="space-y-4 pt-1">
            {/* Patient */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <User size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('patients')}</p>
                <p className="font-bold text-gray-900 dark:text-gray-100">{appointment.patient.name}</p>
                <a
                  href={`tel:${appointment.patient.phone}`}
                  className="flex items-center gap-1 mt-0.5 text-xs text-primary-600 hover:underline"
                  dir="ltr"
                >
                  <Phone size={12} />
                  {appointment.patient.phone}
                </a>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <CalendarIcon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isRTL ? 'الوقت والتاريخ' : 'Date & Time'}
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatDate(appointment.dateTime)}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                  <Clock size={13} className="text-gray-400" />
                  {formatTime(appointment.dateTime)} ({appointment.duration} min)
                </div>
              </div>
            </div>

            {/* Therapist & Room */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isRTL ? 'الأخصائي والعيادة' : 'Therapist & Room'}
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {appointment.therapist.name}
                </p>
                {appointment.room && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                    Room {appointment.room.number}
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <AlignLeft size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isRTL ? 'ملاحظات' : 'Notes'}
                  </p>
                  <p className="text-xs text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
                    {appointment.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Video Link & Meeting Management */}
            <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                  <Video size={16} />
                  <span>{isRTL ? 'رابط استشارة الفيديو (Zoom / Meet)' : 'Video Consultation Link'}</span>
                </div>
                {canEdit && !isEditingVideo && (
                  <button
                    onClick={() => {
                      setVideoLinkInput(currentVideoLink || '');
                      setIsEditingVideo(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Edit2 size={12} />
                    {currentVideoLink ? (isRTL ? 'تعديل الرابط' : 'Edit') : (isRTL ? 'إضافة رابط' : 'Add Link')}
                  </button>
                )}
              </div>

              {isEditingVideo ? (
                <div className="space-y-2 pt-1">
                  <input
                    type="url"
                    value={videoLinkInput}
                    onChange={(e) => setVideoLinkInput(e.target.value)}
                    placeholder="https://zoom.us/j/... أو https://meet.google.com/..."
                    className="w-full text-xs rounded-lg border-indigo-200 dark:border-indigo-800 dark:bg-gray-900 p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir="ltr"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingVideo(false)}
                      className="px-2.5 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                    >
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateVideoLink.mutate(videoLinkInput)}
                      disabled={updateVideoLink.isPending}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                    >
                      <Check size={12} />
                      {updateVideoLink.isPending ? (isRTL ? 'جارِ الحفظ...' : 'Saving...') : (isRTL ? 'حفظ الرابط' : 'Save Link')}
                    </button>
                  </div>
                </div>
              ) : currentVideoLink ? (
                <div className="flex items-center justify-between pt-1">
                  <a
                    href={currentVideoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[240px] block"
                    dir="ltr"
                  >
                    {currentVideoLink}
                  </a>
                  <a
                    href={currentVideoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline"
                  >
                    {isRTL ? 'انضمام الآن' : 'Join Now'}
                    <ExternalLink size={12} />
                  </a>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {isRTL ? 'لم يتم إرفاق رابط فيديو لهذا الموعد بعد.' : 'No video link attached to this appointment.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Status Actions */}
        {canEdit && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
          <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-4 flex gap-3">
            {appointment.status === 'PENDING' && (
              <button
                onClick={() => changeStatus.mutate('CONFIRMED')}
                disabled={changeStatus.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
              >
                <CheckCircle size={18} />
                {t('confirmed')}
              </button>
            )}

            <button
              onClick={() => changeStatus.mutate('CANCELLED')}
              disabled={changeStatus.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
            >
              <XCircle size={18} />
              {t('cancelled')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppointmentDetailsModal;
