// frontend/src/components/RecurringAppointmentForm.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Repeat, Plus, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';

const DAYS = [
  { value: 0, ar: 'أحد', en: 'Sun', short: 'S' },
  { value: 1, ar: 'اثنين', en: 'Mon', short: 'M' },
  { value: 2, ar: 'ثلاثاء', en: 'Tue', short: 'T' },
  { value: 3, ar: 'أربعاء', en: 'Wed', short: 'W' },
  { value: 4, ar: 'خميس', en: 'Thu', short: 'T' },
  { value: 5, ar: 'جمعة', en: 'Fri', short: 'F' },
  { value: 6, ar: 'سبت', en: 'Sat', short: 'S' },
];

export default function RecurringAppointmentForm({ onClose }: { onClose: () => void }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewSessions, setPreviewSessions] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    patientId: '',
    therapistId: '',
    roomId: '',
    startDate: '',
    frequency: 'WEEKLY',
    daysOfWeek: [] as number[],
    sessionCount: 12,
    duration: 45,
    notes: '',
  });

  const { data: patients } = useQuery({
    queryKey: ['recurring-patients'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 100 } });
      return res.data.data;
    },
  });

  const { data: therapists } = useQuery({
    queryKey: ['recurring-therapists'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'THERAPIST' } });
      return res.data;
    },
  });

  const { data: rooms } = useQuery({
    queryKey: ['recurring-rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data;
    },
  });

  const createRecurring = useMutation({
    mutationFn: async () => {
      const res = await api.post('/recurring', {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        roomId: formData.roomId || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || L('فشل الإنشاء', 'Creation failed'));
    },
  });

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => a - b),
    }));
  };

  // Generate preview of sessions
  const generatePreview = () => {
    if (!formData.startDate || formData.daysOfWeek.length === 0) return;

    const sessions: string[] = [];
    const start = new Date(formData.startDate);
    start.setHours(9, 0, 0, 0);

    // Adjust to first valid day
    while (!formData.daysOfWeek.includes(start.getDay())) {
      start.setDate(start.getDate() + 1);
    }

    const interval = formData.frequency === 'BIWEEKLY' ? 14 : 7;
    let currentWeek = 0;
    let lastDate = new Date(start);

    for (let i = 0; i < Math.min(formData.sessionCount, 5); i++) {
      const sessionDate = new Date(lastDate);
      sessions.push(
        sessionDate.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      );

      // Move to next day in pattern
      let nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1);
      while (!formData.daysOfWeek.includes(nextDate.getDay())) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      lastDate = nextDate;
    }

    setPreviewSessions(sessions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.daysOfWeek.length === 0) {
      setError(L('اختر يوم واحد على الأقل', 'Select at least one day'));
      return;
    }

    createRecurring.mutate();
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <CheckCircle size={48} className="text-green-600" />
        <p className="mt-4 text-lg font-semibold text-green-600">
          {L('تم إنشاء المواعيد المتكررة!', 'Recurring appointments created!')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Patient & Therapist */}
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
          <label className="label">{L('الأخصائي', 'Therapist')} *</label>
          <select
            value={formData.therapistId}
            onChange={(e) => setFormData({ ...formData, therapistId: e.target.value })}
            className="input"
            required
          >
            <option value="">{L('اختر', 'Select')}</option>
            {(therapists || []).map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recurring Pattern */}
      <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Repeat size={16} className="text-primary-600" />
          <p className="text-sm font-semibold text-primary-700">
            {L('نمط التكرار', 'Recurrence Pattern')}
          </p>
        </div>

        <div className="space-y-4">
          {/* Frequency */}
          <div className="flex gap-3">
            {[
              { value: 'WEEKLY', ar: 'أسبوعي', en: 'Weekly' },
              { value: 'BIWEEKLY', ar: 'كل أسبوعين', en: 'Bi-weekly' },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormData({ ...formData, frequency: f.value })}
                className={`
                  flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all
                  ${formData.frequency === f.value
                    ? 'border-primary-500 bg-primary-100 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                {lang === 'ar' ? f.ar : f.en}
              </button>
            ))}
          </div>

          {/* Days of week */}
          <div>
            <label className="label">{L('أيام الجلسات', 'Session Days')} *</label>
            <div className="flex gap-2">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`
                    h-10 w-10 rounded-lg border-2 text-sm font-medium transition-all
                    ${formData.daysOfWeek.includes(day.value)
                      ? 'border-primary-500 bg-primary-600 text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }
                  `}
                >
                  {lang === 'ar' ? day.ar : day.short}
                </button>
              ))}
            </div>
          </div>

          {/* Session count */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{L('عدد الجلسات', 'Total Sessions')} *</label>
              <input
                type="number"
                value={formData.sessionCount}
                onChange={(e) => setFormData({ ...formData, sessionCount: parseInt(e.target.value) })}
                className="input"
                min={2}
                max={50}
                required
              />
            </div>
            <div>
              <label className="label">{L('المدة (دقيقة)', 'Duration (min)')}</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="input"
              >
                <option value={30}>30</option>
                <option value={45}>45</option>
                <option value={60}>60</option>
                <option value={90}>90</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Start date */}
      <div>
        <label className="label">{L('تاريخ البداية', 'Start Date')} *</label>
        <input
          type="date"
          value={formData.startDate}
          onChange={(e) => {
            setFormData({ ...formData, startDate: e.target.value });
            setTimeout(generatePreview, 100);
          }}
          className="input"
          required
        />
      </div>

      {/* Preview */}
      {previewSessions.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold text-gray-600">
            {L('معاينة أول 5 جلسات', 'Preview — first 5 sessions')}
          </p>
          <div className="flex flex-wrap gap-2">
            {previewSessions.map((session, i) => (
              <span
                key={i}
                className="rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
              >
                {session}
              </span>
            ))}
            {formData.sessionCount > 5 && (
              <span className="text-xs text-gray-400">
                +{formData.sessionCount - 5} {L('أخرى', 'more')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="label">{L('ملاحظات', 'Notes')}</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="input"
          rows={2}
          placeholder={L('خطة العلاج، تعليمات خاصة...', 'Treatment plan, special instructions...')}
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          {L('إلغاء', 'Cancel')}
        </button>
        <button
          type="submit"
          disabled={createRecurring.isPending}
          className="btn-primary"
        >
          {createRecurring.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            L(`إنشاء ${formData.sessionCount} موعد`, `Create ${formData.sessionCount} Appointments`)
          )}
        </button>
      </div>
    </form>
  );
}