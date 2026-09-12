import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { useI18n } from '../../i18n';
import { ar } from '../../ar';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../../components/ui';
import type { Appointment } from '../../types';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../../store/patient-auth';

export default function PatientAppointments() {
  const { t, lang } = useI18n();
  const { patient } = usePatientAuth();
  const navigate = useNavigate();
  
  const today = new Date();
  const tzOffset = today.getTimezoneOffset() * 60000;
  const localToday = new Date(today.getTime() - tzOffset).toISOString().split('T')[0];
  
  const [filterDate, setFilterDate] = useState<string>(localToday);

  useEffect(() => {
    if (!patient) navigate('/portal/login');
  }, [patient, navigate]);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['portal-appointments'],
    queryFn: async () => {
      // The backend returns all appointments for this patient.
      // We can filter by date locally or on the backend.
      const res = await api.get('/portal/appointments');
      return res.data.data as Appointment[];
    },
    enabled: !!patient
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

  const allAppointments = appointments || [];
  
  // Filter by selected date
  const list = allAppointments.filter(app => {
    if (!filterDate) return true;
    const appDate = new Date(app.dateTime);
    const localAppDate = new Date(appDate.getTime() - appDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    return localAppDate === filterDate;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button onClick={() => navigate('/portal/dashboard')} className="mr-4 p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Appointments</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader
            title={t('appointments')}
            subtitle={`${list.length} ${L(ar.appointmentCount, 'appointments')} for selected date`}
            action={
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="input !w-auto"
                />
              </div>
            }
          />

          {list.length === 0 ? (
            <EmptyState message={t('noData')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Time
                    </th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Therapist
                    </th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {list.map((appt) => (
                    <tr key={appt.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4 text-gray-900 dark:text-gray-100 font-medium">
                        {formatTime(appt.dateTime)}
                      </td>
                      <td className="py-4 text-gray-700 dark:text-gray-300">
                        {appt.therapist?.name || 'Any Therapist'}
                      </td>
                      <td className="py-4">
                        <Badge
                          status={
                            appt.status === 'COMPLETED'
                              ? 'success'
                              : appt.status === 'CANCELLED' ||
                                appt.status === 'NO_SHOW'
                              ? 'error'
                              : appt.status === 'CONFIRMED'
                              ? 'info'
                              : 'warning'
                          }
                        >
                          <span className="flex items-center gap-1.5">
                            {appt.status === 'COMPLETED' ? (
                              <CheckCircle size={14} />
                            ) : appt.status === 'CANCELLED' ? (
                              <XCircle size={14} />
                            ) : appt.status === 'PENDING' ? (
                              <Clock size={14} />
                            ) : (
                              <AlertCircle size={14} />
                            )}
                            {statusLabels[appt.status]}
                          </span>
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}