
// frontend/src/pages/MyRecords.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Activity,
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';
import { StarRating } from '../components/StarRating';
import RatingForm from '../components/RatingForm';
import SurveyForm from '../components/SurveyForm';

interface SessionNote {
  id: string;
  diagnosis: string;
  treatmentPlan: string | null;
  notes: string | null;
  duration: number;
  painLevel: number | null;
  createdAt: string;
}

interface AppointmentRecord {
  id: string;
  dateTime: string;
  duration: number;
  status: string;
  notes: string | null;
  therapist: { id: string; name: string };
  room: { number: number; name: string } | null;
  therapySessions: SessionNote[];
  invoices: Array<{
    id: string;
    number: string;
    total: number;
    status: string;
  }>;
  rating: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  } | null;
  hasSurvey: boolean;
}

export default function MyRecords() {
  const { t, lang } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data: records, isLoading } = useQuery({
    queryKey: ['my-records'],
    queryFn: async () => {
      const res = await api.get('/patients/me/records');
      return res.data as AppointmentRecord[];
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  if (isLoading) return <Spinner className="py-24" />;

  const appointments = records || [];
  const currency = settings?.currency || 'EGP';

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  // Split into upcoming and past
  const now = new Date();

  const upcoming = appointments.filter(
    (a) =>
      new Date(a.dateTime) >= now &&
      (a.status === 'PENDING' || a.status === 'CONFIRMED'),
  );

  const past = appointments.filter(
    (a) =>
      new Date(a.dateTime) < now ||
      a.status === 'COMPLETED' ||
      a.status === 'CANCELLED' ||
      a.status === 'NO_SHOW',
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {L('سجلي الطبي', 'My Medical Records')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {L(
            'تاريخ مواعيدك وجلساتك العلاجية',
            'Your appointment and treatment history',
          )}
        </p>
      </div>

      {/* Upcoming appointments */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader
            title={L('المواعيد القادمة', 'Upcoming Appointments')}
            subtitle={`${upcoming.length} ${L('موعد', 'appointments')}`}
          />

          <div className="space-y-3">
            {upcoming.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Calendar size={20} />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(appt.dateTime)}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(appt.dateTime)} · {appt.therapist.name}
                      {appt.room && ` · Room ${appt.room.number}`}
                    </p>
                  </div>
                </div>

                <Badge status={appt.status}>
                  {statusLabels[appt.status]}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Treatment history */}
      <Card>
        <CardHeader
          title={L('سجل العلاج', 'Treatment History')}
          subtitle={`${past.length} ${L('جلسة', 'sessions')}`}
        />

        {past.length === 0 ? (
          <EmptyState message={L('لا يوجد سجل بعد', 'No history yet')} />
        ) : (
          <div className="space-y-4">
            {past.map((appt) => {
              const isExpanded = expandedId === appt.id;
              const hasSession = appt.therapySessions.length > 0;
              const isCompleted = appt.status === 'COMPLETED';
              const hasRating = !!appt.rating;

              return (
                <div
                  key={appt.id}
                  className={`
                    rounded-xl border p-4 transition-all
                    ${
                      isCompleted
                        ? 'border-green-100 bg-green-50/30'
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50/30'
                    }
                  `}
                >
                  {/* Appointment header */}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : appt.id)
                    }
                    className="flex w-full items-center justify-between text-start"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          flex h-12 w-12 items-center justify-center rounded-lg
                          ${
                            isCompleted
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        {isCompleted ? (
                          <Activity size={20} />
                        ) : (
                          <Calendar size={20} />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatDate(appt.dateTime)}
                        </p>

                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(appt.dateTime)}
                          </span>

                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {appt.therapist.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge status={appt.status}>
                        {statusLabels[appt.status]}
                      </Badge>

                      {hasRating && (
                        <StarRating
                          value={appt.rating!.rating}
                          size={14}
                        />
                      )}

                      {isExpanded ? (
                        <ChevronUp
                          size={18}
                          className="text-gray-400"
                        />
                      ) : (
                        <ChevronDown
                          size={18}
                          className="text-gray-400"
                        />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                      {/* Session notes */}
                      {hasSession && (
                        <div className="space-y-3">
                          {appt.therapySessions.map((session) => (
                            <div
                              key={session.id}
                              className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
                            >
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {L('التشخيص', 'Diagnosis')}
                                  </p>

                                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                    {session.diagnosis}
                                  </p>
                                </div>

                                {session.treatmentPlan && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                      {L(
                                        'خطة العلاج',
                                        'Treatment Plan',
                                      )}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                      {session.treatmentPlan}
                                    </p>
                                  </div>
                                )}

                                {session.notes && (
                                  <div className="sm:col-span-2">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                      {L('ملاحظات', 'Notes')}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                                      {session.notes}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center gap-6">
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                      {L('المدة', 'Duration')}
                                    </p>

                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                      {session.duration}{' '}
                                      {L('دقيقة', 'min')}
                                    </p>
                                  </div>

                                  {session.painLevel !== null && (
                                    <div>
                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        {L(
                                          'مستوى الألم',
                                          'Pain Level',
                                        )}
                                      </p>

                                      <div className="mt-1">
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
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Invoice link */}
                      {appt.invoices.length > 0 && (
                        <div className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
                          <FileText
                            size={16}
                            className="text-emerald-600"
                          />

                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {L('فاتورة', 'Invoice')}{' '}
                              {appt.invoices[0].number}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {Number(appt.invoices[0].total).toFixed(0)}{' '}
                              {currency} — {appt.invoices[0].status}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Rating */}
                      {isCompleted && !hasRating && (
                        <RatingForm appointmentId={appt.id} />
                      )}

                      {isCompleted && hasRating && (
                        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <StarRating
                                value={appt.rating!.rating}
                                size={18}
                              />

                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(
                                  appt.rating!.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {appt.rating!.comment && (
                            <div className="mt-2 flex items-start gap-2">
                              <MessageSquare
                                size={14}
                                className="mt-0.5 text-gray-400"
                              />

                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {appt.rating!.comment}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Satisfaction Survey */}
                      {isCompleted &&
                        !appt.rating &&
                        !appt.hasSurvey && (
                          <SurveyForm
                            appointmentId={appt.id}
                            therapistName={appt.therapist.name}
                            appointmentDate={appt.dateTime}
                          />
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

