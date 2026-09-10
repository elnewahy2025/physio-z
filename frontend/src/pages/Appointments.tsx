import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import {
  Card,
  CardHeader,
  Badge,
  EmptyState,
  Spinner,
} from '../components/ui';
import { FilterBar } from '../components/FilterBar';
import type { Appointment } from '../types';
import { WhatsAppButton } from '../components/InvoiceActions';

export default function Appointments() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  const [showForm, setShowForm] = useState(false);

  const [filters, setFilters] = useState({
    status: '',
    therapistId: '',
  });

  const canManageTherapistFilter =
    user?.role === 'OWNER' || user?.role === 'SECRETARY';

  const { data: therapists } = useQuery({
    queryKey: ['therapists-list'],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { role: 'THERAPIST' },
      });
      return res.data as any[];
    },
    enabled: canManageTherapistFilter,
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', filterDate, filters],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: '50',
      };

      if (filterDate) {
        params.date = filterDate;
      }

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.therapistId) {
        params.therapistId = filters.therapistId;
      }

      // Therapists can only see their own appointments.
      if (user?.role === 'THERAPIST') {
        params.therapistId = user.id;
      }

      const res = await api.get('/appointments', { params });

      return res.data.data as Appointment[];
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await api.get('/patients', {
        params: { limit: 100 },
      });

      return res.data.data as any[];
    },
    enabled: showForm,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data as any[];
    },
    enabled: showForm,
  });

  const changeStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      await api.patch(`/appointments/${id}/status`, { status });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['appointments'],
      });
    },
  });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(
      lang === 'ar' ? 'ar-EG' : 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    );

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
  };

  if (isLoading) {
    return <Spinner className="py-24" />;
  }

  const list = appointments || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('appointments')}
          subtitle={`${list.length} ${
            lang === 'ar' ? 'مواعيد' : 'appointments'
          }`}
          action={
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input !w-auto"
              />

              {(user?.role === 'OWNER' ||
                user?.role === 'SECRETARY' ||
                user?.role === 'PATIENT') && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="btn-primary"
                >
                  <Plus size={16} />
                  {lang === 'ar'
                    ? 'موعد جديد'
                    : 'New Appointment'}
                </button>
              )}
            </div>
          }
        />

        {showForm && (
          <NewAppointmentForm
            patients={patients || []}
            therapists={therapists || []}
            rooms={rooms || []}
            userRole={user?.role || ''}
            onClose={() => setShowForm(false)}
          />
        )}

        {/* Filters */}
        <div className="mb-6">
          <FilterBar
            showStatus={true}
            showTherapist={canManageTherapistFilter}
            therapists={therapists || []}
            onFilterChange={setFilters}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {list.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    <Clock size={20} />
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {appt.patient.name}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(appt.dateTime)} ·{' '}
                      {appt.therapist.name}
                      {appt.room &&
                        ` · Room ${appt.room.number}`}
                      {' · '}
                      {appt.duration}min
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge status={appt.status}>
                    {statusLabels[appt.status] || appt.status}
                  </Badge>

                  {appt.status === 'PENDING' && (
                    <button
                      onClick={() =>
                        changeStatus.mutate({
                          id: appt.id,
                          status: 'CONFIRMED',
                        })
                      }
                      className="rounded-lg p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      title={t('confirmed')}
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}

                  {(appt.status === 'PENDING' ||
                    appt.status === 'CONFIRMED') && (
                    <button
                      onClick={() =>
                        changeStatus.mutate({
                          id: appt.id,
                          status: 'CANCELLED',
                        })
                      }
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title={t('cancelled')}
                    >
                      <XCircle size={18} />
                    </button>
                  )}

                  <WhatsAppButton
                    phone={appt.patient.phone}
                    patientName={appt.patient.name}
                    dateTime={appt.dateTime}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function NewAppointmentForm({
  patients,
  therapists,
  rooms,
  userRole,
  onClose,
}: {
  patients: any[];
  therapists: any[];
  rooms: any[];
  userRole: string;
  onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();

  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: '',
    therapistId: '',
    roomId: '',
    dateTime: '',
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

  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const defaultDateTime = tomorrow
    .toISOString()
    .slice(0, 16);

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
            value={
              formData.dateTime || defaultDateTime
            }
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