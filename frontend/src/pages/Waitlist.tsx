// frontend/src/pages/Waitlist.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, User, Phone, Bell, Check, Trash2, Plus, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, EnhancedEmptyState, Badge } from '../components/ui';

export default function Waitlist() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data: waitlist, isLoading } = useQuery({
    queryKey: ['waitlist'],
    queryFn: async () => {
      const res = await api.get('/waitlist');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </Card>
    );
  }

  const entries = waitlist || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('قائمة الانتظار', 'Waitlist')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {L('مرضى ينتظرون مواعيد ملغاة', 'Patients waiting for cancelled slots')}
          </p>
        </div>

        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          {L('إضافة لقائمة الانتظار', 'Add to Waitlist')}
        </button>
      </div>

      {showAdd && (
        <AddToWaitlistForm
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            queryClient.invalidateQueries({ queryKey: ['waitlist'] });
          }}
        />
      )}

      <Card>
        <CardHeader
          title={L('قائمة الانتظار', 'Waitlist')}
          subtitle={`${entries.length} ${L('مريض ينتظر', 'patients waiting')}`}
        />

        {entries.length === 0 ? (
          <EnhancedEmptyState
            icon={<Clock size={32} />}
            title={L('لا أحد في قائمة الانتظار', 'No one on the waitlist')}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map((entry: any) => (
              <WaitlistEntry key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function WaitlistEntry({ entry }: { entry: any }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const queryClient = useQueryClient();

  const removeFromWaitlist = useMutation({
    mutationFn: async () => {
      await api.delete(`/waitlist/${entry.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });

  const statusColors: Record<string, string> = {
    WAITING: 'bg-yellow-100 text-yellow-800',
    NOTIFIED: 'bg-blue-100 text-blue-800',
    BOOKED: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-gray-100 text-gray-500 dark:text-gray-400',
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
          {entry.patient.name.charAt(0)}
        </div>

        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {entry.patient.name}
          </p>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Phone size={12} />
              {entry.patient.phone}
            </span>
            <span>
              {new Date(entry.preferredDate).toLocaleDateString()} ·{' '}
              {entry.preferredTimeStart}—{entry.preferredTimeEnd}
            </span>
            {entry.therapist && (
              <span>{entry.therapist.name}</span>
            )}
          </div>
          {entry.notes && (
            <p className="mt-1 text-xs text-gray-400">{entry.notes}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`badge ${statusColors[entry.status] || 'bg-gray-100'}`}>
          {entry.status}
        </span>

        {entry.priority > 0 && (
          <span className="badge bg-red-100 text-red-700">
            {L('أولوية', 'Priority')} {entry.priority}
          </span>
        )}

        <button
          onClick={() => removeFromWaitlist.mutate(entry.id)}
          className="rounded-lg p-2 text-red-400 hover:bg-red-50"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function AddToWaitlistForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: '',
    preferredDate: '',
    preferredTimeStart: '09:00',
    preferredTimeEnd: '12:00',
    therapistId: '',
    notes: '',
  });

  const { data: patients } = useQuery({
    queryKey: ['waitlist-patients'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 100 } });
      return res.data.data;
    },
  });

  const { data: therapists } = useQuery({
    queryKey: ['waitlist-therapists'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'THERAPIST' } });
      return res.data;
    },
  });

  const addToWaitlist = useMutation({
    mutationFn: async () => {
      await api.post('/waitlist', {
        ...formData,
        preferredDate: new Date(formData.preferredDate).toISOString(),
        therapistId: formData.therapistId || undefined,
      });
    },
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId || !formData.preferredDate) {
      setError(L('املأ الحقول المطلوبة', 'Fill required fields'));
      return;
    }
    setError(null);
    addToWaitlist.mutate();
  };

  return (
    <Card>
      <CardHeader
        title={L('إضافة لقائمة الانتظار', 'Add to Waitlist')}
        action={
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{L('المريض', 'Patient')} *</label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="input"
              required
            >
              <option value="">{L('اختر', 'Select')}</option>
              {(patients || []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{L('التاريخ المفضل', 'Preferred Date')} *</label>
            <input
              type="date"
              value={formData.preferredDate}
              onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">{L('من الساعة', 'From')}</label>
            <input
              type="time"
              value={formData.preferredTimeStart}
              onChange={(e) => setFormData({ ...formData, preferredTimeStart: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">{L('إلى الساعة', 'To')}</label>
            <input
              type="time"
              value={formData.preferredTimeEnd}
              onChange={(e) => setFormData({ ...formData, preferredTimeEnd: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">{L('أخصائي مفضل', 'Preferred Therapist')}</label>
            <select
              value={formData.therapistId}
              onChange={(e) => setFormData({ ...formData, therapistId: e.target.value })}
              className="input"
            >
              <option value="">{L('أي أخصائي', 'Any therapist')}</option>
              {(therapists || []).map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label">{L('ملاحظات', 'Notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            {L('إلغاء', 'Cancel')}
          </button>
          <button type="submit" disabled={addToWaitlist.isPending} className="btn-primary">
            {addToWaitlist.isPending ? <Loader2 size={16} className="animate-spin" /> : L('إضافة', 'Add')}
          </button>
        </div>
      </form>
    </Card>
  );
}
