// frontend/src/pages/CalendarPage.tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CalendarDays, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { Card, CardHeader, Spinner, Badge } from '../components/ui';
import WeekView from '../components/WeekView';
import MonthView from '../components/MonthView';
import { FilterBar } from '../components/FilterBar';
import type { Appointment } from '../types';
import { CalendarSkeleton } from '../components/Skeletons';
import { AppointmentDetailsModal } from '../components/AppointmentDetailsModal';
import { NewAppointmentForm } from '../components/NewAppointmentForm';

export default function CalendarPage() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filters, setFilters] = useState({
    status: '',
    therapistId: '',
  });

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | null>(null);

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 100 } });
      return res.data.data as any[];
    },
    enabled: newAppointmentDate !== null,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data as any[];
    },
  });

  const maxCapacity = Math.max(rooms?.length || 1, 1);

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  // Calculate week start based on offset
  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    // Adjust to start on Saturday (Arabic) or Sunday (English)
    const startDay = lang === 'ar' ? 6 : 0;
    const diff = (day - startDay + 7) % 7;
    const start = new Date(now);
    start.setDate(now.getDate() - diff + weekOffset * 7);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [weekOffset, lang]);

  // Calculate date range for fetching
  const dateRange = useMemo(() => {
    if (view === 'week') {
      const end = new Date(weekStart);
      end.setDate(end.getDate() + 7);
      return { start: weekStart, end };
    } else {
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const startDay = lang === 'ar' ? 6 : 0;
      while (start.getDay() !== startDay) {
        start.setDate(start.getDate() - 1);
      }
      const endDay = (startDay + 6) % 7;
      while (end.getDay() !== endDay) {
        end.setDate(end.getDate() + 1);
      }
      return { start, end };
    }
  }, [view, weekStart, currentMonth]);

  // Fetch appointments for the date range
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['calendar-appointments', dateRange.start.toISOString(), dateRange.end.toISOString(), filters],
    queryFn: async () => {
      const params: Record<string, string> = {
        limit: '100',
      };

      // Use date range
      const startStr = dateRange.start.toISOString().split('T')[0];
      const endStr = dateRange.end.toISOString().split('T')[0];
      params.startDate = startStr;
      params.endDate = endStr;
      params.limit = '100'; // Max allowed by paginationSchema

      if (filters.status) params.status = filters.status;
      if (filters.therapistId) params.therapistId = filters.therapistId;

      // If therapist, only show own appointments
      if (user?.role === 'THERAPIST' && !filters.therapistId) {
        params.therapistId = user.id;
      }

      const res = await api.get('/appointments', { params });
      return res.data.data as Appointment[];
    },
  });

  // Fetch therapists for filter
  const { data: therapists } = useQuery({
    queryKey: ['calendar-therapists'],
    queryFn: async () => {
      if (user?.role === 'OWNER' || user?.role === 'SECRETARY') {
        const res = await api.get('/users', { params: { role: 'THERAPIST' } });
        return res.data;
      }
      return [];
    },
    enabled: user?.role === 'OWNER' || user?.role === 'SECRETARY',
  });

  const handlePrevWeek = () => setWeekOffset((prev) => prev - 1);
  const handleNextWeek = () => setWeekOffset((prev) => prev + 1);
  const handleToday = () => {
    setWeekOffset(0);
    setCurrentMonth(new Date());
  };

  if (isLoading) return <CalendarSkeleton />;

  const list = appointments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('التقويم', 'Calendar')} <span className="text-sm opacity-50">({list.length})</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {L('عرض المواعيد في التقويم', 'View appointments in calendar')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setView('week')}
              className={`
                flex items-center gap-2 rounded-s-lg px-4 py-2 text-sm font-medium transition-colors
                ${view === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }
              `}
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">{L('أسبوعي', 'Week')}</span>
            </button>
            <button
              onClick={() => setView('month')}
              className={`
                flex items-center gap-2 rounded-e-lg px-4 py-2 text-sm font-medium transition-colors
                ${view === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                }
              `}
            >
              <CalendarDays size={16} />
              <span className="hidden sm:inline">{L('شهري', 'Month')}</span>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            {view === 'week' && (
              <>
                <button
                  onClick={handlePrevWeek}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <ChevronLeft size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
                </button>
                <button
                  onClick={handleToday}
                  className="btn-secondary !py-1.5 !px-3 text-xs"
                >
                  {L('اليوم', 'Today')}
                </button>
                <button
                  onClick={handleNextWeek}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <ChevronRight size={20} className={lang === 'ar' ? 'rotate-180' : ''} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        showStatus={true}
        showTherapist={user?.role === 'OWNER' || user?.role === 'SECRETARY'}
        therapists={therapists || []}
        onFilterChange={(f) => setFilters({ status: f.status || '', therapistId: f.therapistId || '' })}
      />

      {/* Calendar */}
      <Card className="!p-4">
        {view === 'week' ? (
          <WeekView
            appointments={list}
            weekStart={weekStart}
            maxCapacity={maxCapacity}
            onAppointmentClick={(appt) => setSelectedAppointment(appt)}
            onSlotClick={(date, hour) => {
              if (user?.role === 'OWNER' || user?.role === 'SECRETARY' || user?.role === 'PATIENT') {
                const newDate = new Date(date);
                newDate.setHours(hour, 0, 0, 0);
                setNewAppointmentDate(newDate);
              }
            }}
          />
        ) : (
          <MonthView
            appointments={list}
            currentMonth={currentMonth}
            maxCapacity={maxCapacity}
            onMonthChange={setCurrentMonth}
            onAddAppointmentClick={(date) => {
              if (user?.role === 'OWNER' || user?.role === 'SECRETARY' || user?.role === 'PATIENT') {
                const newDate = new Date(date);
                newDate.setHours(10, 0, 0, 0);
                setNewAppointmentDate(newDate);
              }
            }}
            onAppointmentClick={(appt) => setSelectedAppointment(appt)}
          />
        )}
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span>{t('pending')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <span>{t('confirmed')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span>{t('completed')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span>{t('cancelled')}</span>
        </div>
      </div>

      {/* Modals */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          canEdit={user?.role === 'OWNER' || user?.role === 'SECRETARY'}
        />
      )}

      {newAppointmentDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              {lang === 'ar' ? 'موعد جديد' : 'New Appointment'}
            </h2>
            <NewAppointmentForm
              defaultDate={newAppointmentDate}
              patients={patients || []}
              therapists={therapists || []}
              rooms={rooms || []}
              userRole={user?.role || ''}
              onClose={() => setNewAppointmentDate(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}