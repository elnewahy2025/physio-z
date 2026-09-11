import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';

interface NewAppointmentFormProps {
  patients: any[];
  therapists: any[];
  rooms: any[];
  userRole: string;
  onClose: () => void;
  defaultDate?: Date;
}

export function NewAppointmentForm({
  patients,
  therapists,
  rooms,
  userRole,
  onClose,
  defaultDate,
}: NewAppointmentFormProps) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);

  const initialDateTime = defaultDate 
    ? new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    : (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        return new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      })();

  const [formData, setFormData] = useState({
    patientId: '',
    therapistId: '',
    roomId: '',
    dateTime: initialDateTime,
    duration: '45',
    notes: '',
  });

  const createAppointment = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/appointments', {
        ...data,
        duration: parseInt(data.duration),
        roomId: data.roomId || undefined,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appointments'],
      });
      
      queryClient.invalidateQueries({
        queryKey: ['calendar-appointments'],
      });

      onClose();
    },

    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
          'Failed to create appointment',
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createAppointment.mutate(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-xl border border-primary-200 bg-primary-50/50 p-6 dark:border-primary-800 dark:bg-primary-900/20"
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Patient */}
        <div>
          <label className="label">
            {t('patients')}
          </label>

          <select
            value={formData.patientId}
            onChange={(e) =>
              setFormData({
                ...formData,
                patientId: e.target.value,
              })
            }
            className="input"
            required
          >
            <option value="">
              {lang === 'ar'
                ? 'اختر المريض'
                : 'Select patient'}
            </option>

            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} - {p.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Therapist */}
        {userRole !== 'THERAPIST' && (
          <div>
            <label className="label">
              {lang === 'ar'
                ? 'أخصائي العلاج الطبيعي'
                : 'Therapist'}
            </label>

            <select
              value={formData.therapistId}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  therapistId: e.target.value,
                })
              }
              className="input"
              required
            >
              <option value="">
                {lang === 'ar'
                  ? 'اختر الأخصائي'
                  : 'Select therapist'}
              </option>

              {therapists.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Room */}
        <div>
          <label className="label">
            {t('rooms')}
          </label>

          <select
            value={formData.roomId}
            onChange={(e) =>
              setFormData({
                ...formData,
                roomId: e.target.value,
              })
            }
            className="input"
          >
            <option value="">
              {lang === 'ar'
                ? 'بدون غرفة'
                : 'No room'}
            </option>

            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.number}
              </option>
            ))}
          </select>
        </div>

        {/* Date & Time */}
        <div>
          <label className="label">
            {lang === 'ar'
              ? 'التاريخ والوقت'
              : 'Date & Time'}
          </label>

          <input
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) =>
              setFormData({
                ...formData,
                dateTime: e.target.value,
              })
            }
            className="input"
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label className="label">
            {lang === 'ar'
              ? 'المدة (بالدقائق)'
              : 'Duration (min)'}
          </label>

          <select
            value={formData.duration}
            onChange={(e) =>
              setFormData({
                ...formData,
                duration: e.target.value,
              })
            }
            className="input"
          >
            <option value="30">30</option>
            <option value="45">45</option>
            <option value="60">60</option>
            <option value="90">90</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="label">
            {lang === 'ar' ? 'ملاحظات' : 'Notes'}
          </label>

          <input
            type="text"
            value={formData.notes}
            onChange={(e) =>
              setFormData({
                ...formData,
                notes: e.target.value,
              })
            }
            className="input"
            placeholder={
              lang === 'ar'
                ? 'ملاحظات إضافية...'
                : 'Additional notes...'
            }
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary"
        >
          {t('cancel')}
        </button>

        <button
          type="submit"
          disabled={createAppointment.isPending}
          className="btn-primary"
        >
          {createAppointment.isPending
            ? t('loading')
            : t('save')}
        </button>
      </div>
    </form>
  );
}
