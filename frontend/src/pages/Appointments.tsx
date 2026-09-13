import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, User, Video, MapPin, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { ar } from '../ar';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';
import type { Appointment } from '../types';

type TabStatus = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export default function Appointments() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filterDate, setFilterDate] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabStatus>('ALL');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', filterDate],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100' };
      if (filterDate) params.date = filterDate;
      const res = await api.get('/appointments', { params });
      return res.data.data as Appointment[];
    },
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
  };

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  // Derived state
  const list = appointments || [];
  
  const stats = useMemo(() => {
    return {
      total: list.length,
      pending: list.filter(a => a.status === 'PENDING').length,
      confirmed: list.filter(a => a.status === 'CONFIRMED').length,
      completed: list.filter(a => a.status === 'COMPLETED').length,
      cancelled: list.filter(a => a.status === 'CANCELLED' || a.status === 'NO_SHOW').length,
    };
  }, [list]);

  const filteredList = useMemo(() => {
    if (activeTab === 'ALL') return list;
    return list.filter(a => a.status === activeTab);
  }, [list, activeTab]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('appointments')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {L('إدارة المواعيد وجدول الجلسات', 'Manage appointments and session schedule')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input pl-10 pr-10 !w-auto"
              />
              <CalendarIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                  title={L('مسح الفلتر', 'Clear Filter')}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            {(user?.role === 'OWNER' || user?.role === 'SECRETARY' || user?.role === 'PATIENT') && (
              <button onClick={() => setShowForm(true)} className="btn-primary whitespace-nowrap">
                <Plus size={16} />
                <span className="hidden sm:inline">{L(ar.newAppointment, 'New Appointment')}</span>
                <span className="sm:hidden">{L('جديد', 'New')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title={L('الكل', 'Total')} count={stats.total} color="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" />
          <StatCard title={statusLabels['PENDING']} count={stats.pending} color="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" />
          <StatCard title={statusLabels['CONFIRMED']} count={stats.confirmed} color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" />
          <StatCard title={statusLabels['COMPLETED']} count={stats.completed} color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" />
        </div>
      </div>

      <Card>
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex gap-6 overflow-x-auto">
          <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} label={L('الكل', 'All')} count={stats.total} />
          <TabButton active={activeTab === 'PENDING'} onClick={() => setActiveTab('PENDING')} label={statusLabels['PENDING']} count={stats.pending} />
          <TabButton active={activeTab === 'CONFIRMED'} onClick={() => setActiveTab('CONFIRMED')} label={statusLabels['CONFIRMED']} count={stats.confirmed} />
          <TabButton active={activeTab === 'COMPLETED'} onClick={() => setActiveTab('COMPLETED')} label={statusLabels['COMPLETED']} count={stats.completed} />
          <TabButton active={activeTab === 'CANCELLED'} onClick={() => setActiveTab('CANCELLED')} label={statusLabels['CANCELLED']} count={stats.cancelled} />
        </div>

        <div className="p-6">
          {isLoading ? (
            <Spinner className="py-24" />
          ) : filteredList.length === 0 ? (
            <EmptyState message={t('noData')} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredList.map((appt) => (
                <div key={appt.id} className="border border-gray-100 dark:border-gray-700/60 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 flex flex-col sm:flex-row gap-5">
                  
                  {/* Left: Time & Date Info */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-2 sm:min-w-[120px] sm:border-r border-gray-100 dark:border-gray-700 pr-4">
                    <div className="text-center sm:text-left">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{formatTime(appt.dateTime)}</p>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{formatDate(appt.dateTime)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">
                      <Clock size={12} />
                      {appt.duration} {L('د', 'min')}
                    </div>
                  </div>

                  {/* Middle: Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{appt.patient.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-sm text-gray-600 dark:text-gray-300">
                        <span className="flex items-center gap-1">
                          <User size={14} className="text-gray-400" />
                          {appt.therapist.name}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600">•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          {appt.room ? `Room ${appt.room.number}` : L('لم يحدد مكان', 'No room')}
                        </span>
                      </div>
                    </div>

                    {appt.videoLink && (
                      <a href={appt.videoLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2.5 py-1 rounded-md hover:bg-blue-100 transition-colors w-fit">
                        <Video size={14} />
                        {L('رابط الجلسة عن بعد', 'Telehealth Link')}
                      </a>
                    )}
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-gray-100 sm:border-0 dark:border-gray-700">
                    <Badge status={appt.status}>
                      {statusLabels[appt.status] || appt.status}
                    </Badge>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {appt.status === 'PENDING' && (
                        <button
                          onClick={() => changeStatus.mutate({ id: appt.id, status: 'CONFIRMED' })}
                          className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle size={16} />
                          <span className="hidden sm:inline">{L('تأكيد', 'Confirm')}</span>
                        </button>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <button
                          onClick={() => changeStatus.mutate({ id: appt.id, status: 'COMPLETED' })}
                          className="flex items-center gap-1 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle size={16} />
                          <span className="hidden sm:inline">{L('إتمام', 'Complete')}</span>
                        </button>
                      )}
                      {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                        <button
                          onClick={() => changeStatus.mutate({ id: appt.id, status: 'CANCELLED' })}
                          className="flex items-center gap-1 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <XCircle size={16} />
                          <span className="hidden sm:inline">{L('إلغاء', 'Cancel')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal for New Appointment */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {L(ar.newAppointment, 'New Appointment')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <NewAppointmentForm
                selectedDate={filterDate}
                onClose={() => setShowForm(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col justify-center items-center text-center ${color}`}>
      <span className="text-3xl font-bold">{count}</span>
      <span className="text-xs font-medium uppercase tracking-wider opacity-80 mt-1">{title}</span>
    </div>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 px-2 whitespace-nowrap text-sm font-medium transition-colors border-b-2 flex items-center gap-2
        ${active 
          ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
        }`}
    >
      {label}
      <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
        {count}
      </span>
    </button>
  );
}

function NewAppointmentForm({
  selectedDate, onClose,
}: {
  selectedDate: string; onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  
  // Data fetching inside the component to keep it isolated when Modal opens
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 100 } });
      return res.data.data as any[];
    }
  });

  const { data: therapists = [] } = useQuery({
    queryKey: ['therapists-list'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'THERAPIST' } });
      return res.data as any[];
    }
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data as any[];
    }
  });

  const defaultDate = new Date(selectedDate || Date.now());
  defaultDate.setHours(10, 0, 0, 0);
  const formTzOffset = defaultDate.getTimezoneOffset() * 60000;
  const localIso = new Date(defaultDate.getTime() - formTzOffset).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    patientId: '', therapistId: '', roomId: '', dateTime: localIso, duration: '45', notes: '', videoLink: '',
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="label mb-1 block">{t('patients')}</label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="input w-full" required
          >
            <option value="">{L(ar.selectPatient, 'Select patient')}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1 block">{L(ar.therapist, 'Therapist')}</label>
          <select
            value={formData.therapistId}
            onChange={(e) => setFormData({ ...formData, therapistId: e.target.value })}
            className="input w-full" required
          >
            <option value="">{L(ar.selectTherapist, 'Select therapist')}</option>
            {therapists.map((th) => (
              <option key={th.id} value={th.id}>{th.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1 block">{t('rooms')}</label>
          <select
            value={formData.roomId}
            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
            className="input w-full"
          >
            <option value="">{L(ar.noRoom, 'No room')}</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>Room {r.number}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1 block">{L(ar.dateTimeLabel, 'Date & Time')}</label>
          <input
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            className="input w-full" required
          />
        </div>
        <div>
          <label className="label mb-1 block">{L(ar.durationMin, 'Duration (min)')}</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="input w-full"
          >
            <option value="30">30</option>
            <option value="45">45</option>
            <option value="60">60</option>
            <option value="90">90</option>
          </select>
        </div>
        <div>
          <label className="label mb-1 block">{L(ar.notesLabel, 'Notes')}</label>
          <input
            type="text" value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input w-full" placeholder={L(ar.notesPlaceholder, 'Additional notes...')}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label mb-1 block">{L('رابط استشارة فيديو (اختياري)', 'Video Link (Optional)')}</label>
          <input
            type="url" value={formData.videoLink}
            onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
            className="input w-full" placeholder="https://zoom.us/j/... or https://meet.google.com/..."
            dir="ltr"
          />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onClose} className="btn-secondary px-6">{t('cancel')}</button>
        <button type="submit" disabled={createAppointment.isPending} className="btn-primary px-8">
          {createAppointment.isPending ? L('جاري الحفظ...', 'Saving...') : t('save')}
        </button>
      </div>
    </form>
  );
}