import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileEdit, Activity, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import SessionCharting from '../modules/clinical/components/SessionCharting';
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
  const navigate = useNavigate();
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
          subtitle={`${sessions.length} ${L('جلسة', 'sessions')}`}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/protocols')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-bold transition"
              >
                <BookOpen size={15} />
                {L('البروتوكولات السريرية', 'Clinical Protocols')}
              </button>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                <Plus size={16} />
                {L('إضافة جلسة', 'Add Session Notes')}
              </button>
            </div>
          }
        />

        {showForm && <SessionCharting onClose={() => setShowForm(false)} />}

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
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {session.appointment.patient.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(session.appointment.dateTime).toLocaleDateString(
                          lang === 'ar' ? 'ar-EG' : 'en-US',
                          { year: 'numeric', month: 'long', day: 'numeric' },
                        )}
                        {' · '}
                        {session.therapist.name}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {L('\u0627\u0644\u062a\u0634\u062e\u064a\u0635', 'Diagnosis')}:
                          </span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">{session.diagnosis}</span>
                        </p>
                        {session.treatmentPlan && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {L('\u062e\u0637\u0629 \u0627\u0644\u0639\u0644\u0627\u062c', 'Treatment Plan')}:
                            </span>{' '}
                            <span className="text-gray-600 dark:text-gray-400">{session.treatmentPlan}</span>
                          </p>
                        )}
                        {session.notes && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {L('\u0645\u0644\u0627\u062d\u0638\u0627\u062a', 'Notes')}:
                            </span>{' '}
                            <span className="text-gray-600 dark:text-gray-400">{session.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge status="COMPLETED">
                      {L('\u0645\u0643\u062a\u0645\u0644\u0629', 'Completed')}
                    </Badge>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {session.duration} {L('\u062f\u0642\u064a\u0642\u0629', 'min')}
                    </div>
                    {session.painLevel !== null && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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