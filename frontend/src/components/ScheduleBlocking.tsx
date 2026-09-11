// frontend/src/components/ScheduleBlocking.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, EmptyState } from './ui';

interface BlockedSlot {
  id: string;
  userId: string;
  user: { id: string; name: string };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason: string | null;
  isRecurring: boolean;
}

const DAYS = [
  { value: 0, ar: 'الأحد', en: 'Sunday' },
  { value: 1, ar: 'الاثنين', en: 'Monday' },
  { value: 2, ar: 'الثلاثاء', en: 'Tuesday' },
  { value: 3, ar: 'الأربعاء', en: 'Wednesday' },
  { value: 4, ar: 'الخميس', en: 'Thursday' },
  { value: 5, ar: 'الجمعة', en: 'Friday' },
  { value: 6, ar: 'السبت', en: 'Saturday' },
];

export default function ScheduleBlocking() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: therapists } = useQuery({
    queryKey: ['schedule-therapists'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'THERAPIST' } });
      return res.data;
    },
  });

  const { data: blockedSlots, isLoading } = useQuery({
    queryKey: ['blocked-slots'],
    queryFn: async () => {
      const res = await api.get('/schedule/blocked');
      return res.data as BlockedSlot[];
    },
  });

  const [formData, setFormData] = useState({
    userId: '',
    dayOfWeek: '1',
    startTime: '13:00',
    endTime: '14:00',
    reason: '',
  });

  const createSlot = useMutation({
    mutationFn: async () => {
      await api.post('/schedule/blocked', {
        userId: formData.userId,
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        endTime: formData.endTime,
        reason: formData.reason || undefined,
        isRecurring: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-slots'] });
      setShowForm(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || L('فشل الحفظ', 'Failed'));
    },
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/schedule/blocked/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-slots'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userId) {
      setError(L('اختر أخصائي', 'Select therapist'));
      return;
    }
    setError(null);
    createSlot.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <div className="h-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={L('حجب المواعيد', 'Schedule Blocking')}
        subtitle={L('حجب أوقات الراحة والاجتماعات والعطلات', 'Block break times, meetings, and vacations')}
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn-primary !py-2 !px-4 text-sm">
            <Plus size={16} />
            {L('حجب وقت', 'Block Time')}
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 rounded-xl border border-primary-200 bg-primary-50/50 p-4">
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label">{L('الأخصائي', 'Therapist')} *</label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="input"
                required
              >
                <option value="">{L('اختر', 'Select')}</option>
                {(therapists || []).map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{L('اليوم', 'Day')}</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="input"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {lang === 'ar' ? d.ar : d.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{L('من', 'From')}</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">{L('إلى', 'To')}</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="label">{L('السبب', 'Reason')}</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="input"
                placeholder={L('استراحة غداء، اجتماع، إجازة...', 'Lunch break, meeting, vacation...')}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !py-1.5 !px-3 text-xs">
              {L('إلغاء', 'Cancel')}
            </button>
            <button type="submit" disabled={createSlot.isPending} className="btn-primary !py-1.5 !px-3 text-xs">
              {createSlot.isPending ? <Loader2 size={14} className="animate-spin" /> : L('حفظ', 'Save')}
            </button>
          </div>
        </form>
      )}

      {(blockedSlots || []).length === 0 ? (
        <EmptyState message={L('لا توجد أوقات محجوبة', 'No blocked times')} />
      ) : (
        <div className="divide-y divide-gray-100">
          {(blockedSlots || []).map((slot) => (
            <div key={slot.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {slot.user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {DAYS.find((d) => d.value === slot.dayOfWeek)?.[lang === 'ar' ? 'ar' : 'en']} ·{' '}
                    {slot.startTime} — {slot.endTime}
                    {slot.reason && ` · ${slot.reason}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteSlot.mutate(slot.id)}
                className="rounded-lg p-2 text-red-400 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}