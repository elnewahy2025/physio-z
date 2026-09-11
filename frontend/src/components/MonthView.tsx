// frontend/src/components/MonthView.tsx
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Appointment } from '../types';

interface MonthViewProps {
  appointments: Appointment[];
  currentMonth: Date;
  maxCapacity?: number;
  onMonthChange: (date: Date) => void;
  onAddAppointmentClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
}

const STATUS_DOT_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500',
  CONFIRMED: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-red-500',
  NO_SHOW: 'bg-gray-400',
};

export default function MonthView({
  appointments,
  currentMonth,
  maxCapacity = 1,
  onMonthChange,
  onAddAppointmentClick,
  onAppointmentClick,
}: MonthViewProps) {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthNames = isRTL
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const weekDays = isRTL
    ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar grid
  const days = useMemo(() => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Adjust to start on the correct day (Saturday for Arabic, Sunday for English)
    const startDay = isRTL ? 6 : 0;
    while (start.getDay() !== startDay) {
      start.setDate(start.getDate() - 1);
    }
    const endDay = (startDay + 6) % 7;
    while (end.getDay() !== endDay) {
      end.setDate(end.getDate() + 1);
    }

    const arr: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      arr.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return arr;
  }, [currentMonth, isRTL]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const dateKey = new Date(appt.dateTime).toDateString();
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(appt);
    }
    return map;
  }, [appointments]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    onMonthChange(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange(prev);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
  };

  // Get appointments for selected day
  const selectedDayAppointments = selectedDay
    ? appointmentsByDate.get(selectedDay.toDateString()) || []
    : [];

  return (
    <div className="space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ChevronLeft size={20} className={isRTL ? 'rotate-180' : ''} />
        </button>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <ChevronRight size={20} className={isRTL ? 'rotate-180' : ''} />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1" dir={isRTL ? 'rtl' : 'ltr'}>
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1" dir={isRTL ? 'rtl' : 'ltr'}>
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isPast = day < today;
          const isToday = day.toDateString() === today.toDateString();
          const isSelected = selectedDay?.toDateString() === day.toDateString();
          const dayAppointments = appointmentsByDate.get(day.toDateString()) || [];

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              disabled={isPast && dayAppointments.length === 0}
              className={`
                relative flex min-h-[80px] flex-col rounded-lg border p-2 transition-all
                ${!isCurrentMonth
                  ? 'border-transparent text-gray-300 dark:text-gray-600'
                  : isPast
                    ? 'border-gray-100 bg-gray-50/50 text-gray-400 dark:border-gray-800 dark:bg-gray-900/20 dark:text-gray-500'
                    : 'cursor-pointer border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-primary-600 dark:hover:bg-primary-900/20'
                }
                ${isToday ? 'border-2 border-primary-500 dark:border-primary-400' : ''}
                ${isSelected ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500 dark:ring-primary-400' : ''}
              `}
            >
              <span
                className={`
                  text-sm font-semibold
                  ${isToday ? 'text-primary-600 dark:text-primary-400' : ''}
                `}
              >
                {day.getDate()}
              </span>

              {/* Appointment indicators */}
              {dayAppointments.length > 0 && (
                <div className="mt-auto flex flex-wrap gap-1 pt-1">
                  {dayAppointments.slice(0, 4).map((appt) => (
                    <span
                      key={appt.id}
                      className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT_COLORS[appt.status] || 'bg-gray-400'}`}
                    />
                  ))}
                  {dayAppointments.length > 4 && (
                    <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500">
                      +{dayAppointments.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day appointments */}
      {selectedDay && selectedDayAppointments.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-primary-600" />
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {selectedDay.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
              <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {selectedDayAppointments.length}
              </span>
            </div>
            {onAddAppointmentClick && (
              <button
                onClick={() => onAddAppointmentClick(selectedDay)}
                className="btn-primary !py-1 !px-3 text-xs"
              >
                {isRTL ? '+ إضافة موعد' : '+ Add Appointment'}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {selectedDayAppointments.map((appt) => (
              <button
                key={appt.id}
                onClick={() => onAppointmentClick?.(appt)}
                className="flex w-full items-center justify-between rounded-lg bg-gray-50 p-3 text-start transition-colors hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(appt.dateTime).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {appt.patient?.name || 'Patient'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {appt.therapist?.name} · {appt.room ? `Room ${appt.room.number}` : 'No room'}
                    </p>
                  </div>
                </div>
                <span
                  className={`badge ${
                    appt.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : appt.status === 'CONFIRMED'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : appt.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {appt.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}