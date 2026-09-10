// frontend/src/pages/Sessions.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileEdit, Activity, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { ar } from '../ar';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';

interface TherapySession {
  id: string;
  appointmentId: string;
  therapistId: string;
  diagnosis: string;
  treatmentPlan: string | null;
  notes: string | null;
  duration: number;
  painLevel: number | null;
  createdAt: string;
  appointment: {
    id: string;
    dateTime: string;
    patient: { id: string; name: string; phone: string };
  };
  therapist: { id: string; name: string };
}

export default function Sessions() {
  const { t, lang } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions', { params: { limit: 50 } });
      return res.data;
    },
  });

  if (isLoading) return <Spinner className="py-24" />;

  const sessions: TherapySession[] = data?.data || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('sessions')}
          subtitle={`${sessions.length} ${L('\u062c\u0644\u0633\u0629', 'sessions')}`}
          action={
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              <Plus size={16} />
              {L('\u0625\u0636\u0627\u0641\u0629 \u062c\u0644\u0633\u0629', 'Add Session Notes')}
            </button>
          }
        />

        {showForm && <NewSessionForm onClose={() => setShowForm(false)} />}

        {sessions.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <div className="divide-y divide-gray-100">
            {sessions.map((session) => (
              <div key={session.id} className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.appointment.patient.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.appointment.dateTime).toLocaleDateString(
                          lang === 'ar' ? 'ar-EG' : 'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' },
                        )}
                        {' · '}
                        {session.therapist.name}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700">
                            {L('\u0627\u0644\u062a\u0634\u062e\u064a\u0635', 'Diagnosis')}:
                          </span>{' '}
                          <span className="text-gray-600">{session.diagnosis}</span>
                        </p>
                        {session.treatmentPlan && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">
                              {L('\u062e\u0637\u0629 \u0627\u0644\u0639\u0644\u0627\u062c', 'Treatment Plan')}:
                            </span>{' '}
                            <span className="text-gray-600">{session.treatmentPlan}</span>
                          </p>
                        )}
                        {session.notes && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700">
                              {L('\u0645\u0644\u0627\u062d\u0638\u0627\u062a', 'Notes')}:
                            </span>{' '}
                            <span className="text-gray-600">{session.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge status="COMPLETED">
                      {L('\u0645\u0643\u062a\u0645\u0644\u0629', 'Completed')}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      {session.duration} {L('\u062f\u0642\u064a\u0642\u0629', 'min')}
                    </div>
                    {session.painLevel !== null && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          {L('\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0623\u0644\u0645', 'Pain')}:
                        </span>
                        <span
                          className={`badge ${
                            session.painLevel <= 3
                              ? 'bg-green-100 text-green-800'
                              : session.painLevel <= 6
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {session.painLevel}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function NewSessionForm({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const { data: completedAppointments } = useQuery({
    queryKey: ['completed-appointments'],
    queryFn: async () => {
      const res = await api.get('/appointments', {
        params: { status: 'COMPLETED', limit: 50 },
      });
      return res.data.data as any[];
    },
  });

  const [formData, setFormData] = useState({
    appointmentId: '',
    diagnosis: '',
    treatmentPlan: '',
    notes: '',
    painLevel: '',
  });

  const createSession = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/sessions', {
        appointmentId: data.appointmentId,
        diagnosis: data.diagnosis,
        treatmentPlan: data.treatmentPlan || undefined,
        notes: data.notes || undefined,
        painLevel: data.painLevel ? parseInt(data.painLevel) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create session');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createSession.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-teal-200 bg-teal-50/50 p-6">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
        {L(
          '\u064a\u0645\u0643\u0646\u0643 \u0625\u0636\u0627\u0641\u0629 \u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u062c\u0644\u0633\u0629 \u0641\u0642\u0637 \u0644\u0644\u0645\u0648\u0627\u0639\u064a\u062f \u0627\u0644\u0645\u0643\u062a\u0645\u0644\u0629',
          'You can only add session notes to COMPLETED appointments',
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="label">
            {L('\u0627\u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0645\u0643\u062a\u0645\u0644', 'Completed Appointment')} *
          </label>
          <select
            value={formData.appointmentId}
            onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
            className="input"
            required
          >
            <option value="">
              {L('\u0627\u062e\u062a\u0631 \u0645\u0648\u0639\u062f', 'Select appointment')}
            </option>
            {(completedAppointments || []).map((appt) => (
              <option key={appt.id} value={appt.id}>
                {appt.patient?.name} — {new Date(appt.dateTime).toLocaleDateString()} —{' '}
                {appt.therapist?.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">
            {L('\u0627\u0644\u062a\u0634\u062e\u064a\u0635', 'Diagnosis')} *
          </label>
          <textarea
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            className="input"
            rows={2}
            required
            minLength={3}
            placeholder={L(
              '\u0627\u0644\u062a\u0634\u062e\u064a\u0635 \u0627\u0644\u0637\u0628\u064a...',
              'Medical diagnosis...',
            )}
          />
        </div>

        <div>
          <label className="label">
            {L('\u062e\u0637\u0629 \u0627\u0644\u0639\u0644\u0627\u062c', 'Treatment Plan')}
          </label>
          <textarea
            value={formData.treatmentPlan}
            onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
            className="input"
            rows={2}
            placeholder={L(
              '\u0627\u0644\u062a\u0645\u0627\u0631\u064a\u0646 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629\u060c \u0627\u0644\u062a\u062f\u0639\u064a\u0627\u062a...',
              'Exercises, modalities, recommendations...',
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">
              {L('\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629', 'Additional Notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
            />
          </div>
          <div>
            <label className="label">
              {L('\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0623\u0644\u0645 (0-10)', 'Pain Level (0-10)')}
            </label>
            <select
              value={formData.painLevel}
              onChange={(e) => setFormData({ ...formData, painLevel: e.target.value })}
              className="input"
            >
              <option value="">{L('\u0627\u062e\u062a\u0631', 'Select')}</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={createSession.isPending}
          className="btn-primary"
        >
          <FileEdit size={16} />
          {createSession.isPending ? t('loading') : t('save')}
        </button>
      </div>
    </form>
  );
}