import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { ar } from '../ar';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';
import type { Appointment } from '../types';

export default function Appointments() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localToday = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
  
  const [filterDate, setFilterDate] = useState<string>(localToday);
  const [showForm, setShowForm] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', filterDate],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '50' };
      if (filterDate) params.date = filterDate;
      const res = await api.get('/appointments', { params });
      return res.data.data as Appointment[];
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 100 } });
      return res.data.data as any[];
    },
    enabled: showForm,
  });

  const { data: therapists } = useQuery({
    queryKey: ['therapists-list'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'THERAPIST' } });
      return res.data as any[];
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
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
  };

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  if (isLoading) return <Spinner className="py-24" />;

  const list = appointments || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('appointments')}
          subtitle={`${list.length} ${L(ar.appointmentCount, 'appointments')}`}
          action={
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input !w-auto"
              />
              {(user?.role === 'OWNER' || user?.role === 'SECRETARY' || user?.role === 'PATIENT') && (
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                  <Plus size={16} />
                  {L(ar.newAppointment, 'New Appointment')}
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
            selectedDate={filterDate}
            onClose={() => setShowForm(false)}
          />
        )}

        {list.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appt.patient.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(appt.dateTime)} آ· {appt.therapist.name}
                      {appt.room && ` آ· Room ${appt.room.number}`}
                      آ· {appt.duration}min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={appt.status}>
                    {statusLabels[appt.status] || appt.status}
                  </Badge>
                  {appt.status === 'PENDING' && (
                    <button
                      onClick={() => changeStatus.mutate({ id: appt.id, status: 'CONFIRMED' })}
                      className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                      title={t('confirmed')}
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                    <button
                      onClick={() => changeStatus.mutate({ id: appt.id, status: 'CANCELLED' })}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      title={t('cancelled')}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
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
  patients, therapists, rooms, selectedDate, onClose,
}: {
  patients: any[]; therapists: any[]; rooms: any[]; selectedDate: string; onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  
  const defaultDate = new Date(selectedDate);
  defaultDate.setHours(10, 0, 0, 0);
  const formTzOffset = defaultDate.getTimezoneOffset() * 60000;
  const localIso = new Date(defaultDate.getTime() - formTzOffset).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    patientId: '', therapistId: '', roomId: '', dateTime: localIso, duration: '45', notes: '',
  });

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const createAppointment = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/appointments', {
        ...data, duration: parseInt(data.duration), roomId: data.roomId || undefined,
      }, { timeout: 10000 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create appointment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createAppointment.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-primary-200 bg-primary-50/50 p-6">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">{t('patients')}</label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="input" required
          >
            <option value="">{L(ar.selectPatient, 'Select patient')}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{L(ar.therapist, 'Therapist')}</label>
          <select
            value={formData.therapistId}
            onChange={(e) => setFormData({ ...formData, therapistId: e.target.value })}
            className="input" required
          >
            <option value="">{L(ar.selectTherapist, 'Select therapist')}</option>
            {therapists.map((th) => (
              <option key={th.id} value={th.id}>{th.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('rooms')}</label>
          <select
            value={formData.roomId}
            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
            className="input"
          >
            <option value="">{L(ar.noRoom, 'No room')}</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>Room {r.number}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{L(ar.dateTimeLabel, 'Date & Time')}</label>
          <input
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            className="input" required
          />
        </div>
        <div>
          <label className="label">{L(ar.durationMin, 'Duration (min)')}</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="input"
          >
            <option value="30">30</option>
            <option value="45">45</option>
            <option value="60">60</option>
            <option value="90">90</option>
          </select>
        </div>
        <div>
          <label className="label">{L(ar.notesLabel, 'Notes')}</label>
          <input
            type="text" value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input" placeholder={L(ar.notesPlaceholder, 'Additional notes...')}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
        <button type="submit" disabled={createAppointment.isPending} className="btn-primary">
          {createAppointment.isPending ? L('جاري الحفظ...', 'Saving...') : t('save')}
        </button>
      </div>
    </form>
  );
}