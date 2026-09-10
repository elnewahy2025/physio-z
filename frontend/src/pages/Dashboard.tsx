import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  Clock,
  TrendingUp,
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';
import { StatCard, Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';
import type { Appointment, Invoice, Patient } from '../types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { t, lang } = useI18n();

  const { data: appointments, isLoading: apptLoading } = useQuery({
    queryKey: ['appointments', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get('/appointments', {
        params: { date: today, limit: 10 },
      });
      return res.data.data as Appointment[];
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 1 } });
      return res.data.pagination.total as number;
    },
    enabled: user?.role !== 'PATIENT',
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices', 'recent'],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { limit: 5 } });
      return res.data.data as Invoice[];
    },
    enabled: user?.role === 'OWNER' || user?.role === 'SECRETARY',
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
    enabled: user?.role === 'OWNER' || user?.role === 'SECRETARY',
  });

  if (apptLoading) {
    return <Spinner className="py-24" />;
  }

  const todayAppointments = appointments || [];
  const totalPatients = patients || 0;
  const currency = settings?.currency || 'EGP';

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
    PAID: t('paid'),
    UNPAID: t('unpaid'),
    PARTIALLY_PAID: t('partiallyPaid'),
    OVERDUE: t('overdue'),
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('todaysAppointments')}
          value={todayAppointments.length}
          icon={<Calendar size={24} />}
          color="primary"
        />
        {user?.role !== 'PATIENT' && (
          <StatCard
            title={t('totalPatients')}
            value={totalPatients}
            icon={<Users size={24} />}
            color="green"
          />
        )}
        {user?.role !== 'PATIENT' && (
          <StatCard
            title={t('pendingInvoices')}
            value={
              (invoices || []).filter((inv) => inv.status !== 'PAID').length
            }
            icon={<FileText size={24} />}
            color="yellow"
          />
        )}
        <StatCard
          title={t('upcomingAppointments')}
          value={
            todayAppointments.filter(
              (a) => a.status === 'PENDING' || a.status === 'CONFIRMED',
            ).length
          }
          icon={<Clock size={24} />}
          color="primary"
        />
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader
          title={t('todaysAppointments')}
          subtitle={`${todayAppointments.length} ${lang === 'ar' ? 'ظ…ظˆط¹ط¯' : 'appointments'}`}
        />
        {todayAppointments.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <div className="divide-y divide-gray-100">
            {todayAppointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {appt.patient.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTime(appt.dateTime)} آ· {appt.therapist.name}
                      {appt.room && ` آ· ${t('rooms')} ${appt.room.number}`}
                    </p>
                  </div>
                </div>
                <Badge status={appt.status}>
                  {statusLabels[appt.status] || appt.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Invoices (Owner/Secretary only) */}
      {(user?.role === 'OWNER' || user?.role === 'SECRETARY') && (
        <Card>
          <CardHeader
            title={t('recentPayments')}
            subtitle={`${(invoices || []).length} ${lang === 'ar' ? 'ظپظˆط§طھظٹط±' : 'invoices'}`}
          />
          {(invoices || []).length === 0 ? (
            <EmptyState message={t('noData')} />
          ) : (
            <div className="divide-y divide-gray-100">
              {invoices!.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {inv.number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {inv.patient.name} آ· {formatDate(inv.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">
                      {Number(inv.total).toFixed(0)} {currency}
                    </span>
                    <Badge status={inv.status}>
                      {statusLabels[inv.status] || inv.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}