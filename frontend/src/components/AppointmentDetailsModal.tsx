import { X, Clock, User, Phone, MapPin, AlignLeft, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';
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

export function AppointmentDetailsModal({ appointment, onClose, canEdit = true }: AppointmentDetailsModalProps) {
  const { t, lang } = useI18n();
  const isRTL = lang === 'ar';
  const queryClient = useQueryClient();

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
      day: 'numeric'
    });

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-white">
            {isRTL ? 'تفاصيل الموعد' : 'Appointment Details'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <Badge status={appointment.status}>
              {statusLabels[appointment.status] || appointment.status}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Patient */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <User size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('patients')}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">{appointment.patient.name}</p>
                <a href={`tel:${appointment.patient.phone}`} className="flex items-center gap-1 mt-1 text-sm text-primary-600 hover:underline">
                  <Phone size={12} />
                  {appointment.patient.phone}
                </a>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <CalendarIcon size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{isRTL ? 'الوقت والتاريخ' : 'Date & Time'}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">{formatDate(appointment.dateTime)}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-300">
                  <Clock size={14} className="text-gray-400" />
                  {formatTime(appointment.dateTime)} ({appointment.duration} min)
                </div>
              </div>
            </div>

            {/* Therapist & Room */}
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-purple-50 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{isRTL ? 'الأخصائي والعيادة' : 'Therapist & Room'}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white">{appointment.therapist.name}</p>
                {appointment.room && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Room {appointment.room.number}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-gray-100 p-2 text-gray-600 dark:text-gray-400 dark:bg-gray-800 dark:text-gray-400">
                  <AlignLeft size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{isRTL ? 'ملاحظات' : 'Notes'}</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 dark:text-white mt-1 whitespace-pre-wrap">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canEdit && (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
          <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 dark:border-gray-700 dark:bg-gray-800/50 flex gap-3">
            {appointment.status === 'PENDING' && (
              <button
                onClick={() => changeStatus.mutate('CONFIRMED')}
                disabled={changeStatus.isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={18} />
                {t('confirmed')}
              </button>
            )}
            
            <button
              onClick={() => changeStatus.mutate('CANCELLED')}
              disabled={changeStatus.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:bg-gray-800 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
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
