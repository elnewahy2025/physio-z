// frontend/src/components/WeekView.tsx
import { useMemo } from 'react';
import { Clock, User, MapPin } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Appointment } from '../types';

const WORKING_START = 9;
const WORKING_END = 23;
const HOUR_HEIGHT = 64; // pixels per hour

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

interface WeekViewProps {
  appointments: Appointment[];
  weekStart: Date;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSlotClick?: (date: Date, hour: number) => void;
}

export default function WeekView({
  appointments,
  weekStart,
  onAppointmentClick,
  onSlotClick,
}: WeekViewProps) {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';

  // Generate 7 days starting from weekStart
  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekStart]);

  // Generate hour labels
  const hours = useMemo(() => {
    const arr: number[] = [];
    for (let h = WORKING_START; h < WORKING_END; h++) arr.push(h);
    return arr;
  }, []);

  const dayNames = isRTL
    ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const today = new Date();
  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  const formatHour = (hour: number) => {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
      hour: 'numeric',
      hour12: true,
    });
  };

  // Group appointments by day and hour
  const appointmentsByDayHour = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const date = new Date(appt.dateTime);
      const dayKey = date.toDateString();
      const hourKey = `${dayKey}-${date.getHours()}`;
      if (!map.has(hourKey)) map.set(hourKey, []);
      map.get(hourKey)!.push(appt);
    }
    return map;
  }, [appointments]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Header row */}
        <div
          className="grid border-b border-gray-200 dark:border-gray-700"
          style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="p-2" />
          {days.map((day, i) => (
            <div
              key={i}
              className={`
                border-s border-gray-200 p-2 text-center dark:border-gray-700
                ${isToday(day) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
              `}
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {dayNames[i]}
              </div>
              <div
                className={`
                  mt-1 text-lg font-bold
                  ${isToday(day)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-900 dark:text-gray-100'
                  }
                `}
              >
                {day.getDate()}
              </div>
              {isToday(day) && (
                <div className="text-[10px] font-medium text-primary-600 dark:text-primary-400">
                  {isRTL ? 'اليوم' : 'Today'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `80px repeat(7, 1fr)`,
            gridTemplateRows: `repeat(${hours.length}, minmax(${HOUR_HEIGHT}px, auto))`,
          }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Hour labels */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-gray-100 dark:border-gray-800 p-2 text-end text-xs text-gray-400 dark:text-gray-500"
            >
              {formatHour(hour)}
            </div>
          ))}

          {/* Appointment cells */}
          {hours.map((hour) =>
            days.map((day, dayIdx) => {
              const hourKey = `${day.toDateString()}-${hour}`;
              const slotAppointments = appointmentsByDayHour.get(hourKey) || [];
              const isPast = day < today || (isToday(day) && hour < today.getHours());
              const isTodaySlot = isToday(day);

              return (
                <div
                  key={`${dayIdx}-${hour}`}
                  onClick={() => onSlotClick?.(day, hour)}
                  className={`
                    relative border-b border-s border-gray-100 dark:border-gray-800
                    ${isPast ? 'bg-gray-50/50 dark:bg-gray-900/30' : 'cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10'}
                    ${isTodaySlot ? 'bg-primary-50/20 dark:bg-primary-900/10' : ''}
                    transition-colors
                  `}
                >
                  {/* Appointments in this slot */}
                  <div className="flex h-full flex-col gap-1 p-1">
                    {slotAppointments.map((appt) => (
                      <button
                        key={appt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(appt);
                        }}
                        className={`
                          w-full rounded-md border px-2 py-1 text-start text-xs transition-all hover:scale-[1.02] hover:shadow-md shrink-0
                          ${STATUS_COLORS[appt.status] || STATUS_COLORS['PENDING']}
                        `}
                        style={{
                          minHeight: `${Math.min((appt.duration / 60) * HOUR_HEIGHT - 4, 56)}px`,
                        }}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <User size={10} className="shrink-0" />
                          <span className="truncate font-medium">
                            {appt.patient?.name || 'Patient'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 truncate text-[10px] opacity-75">
                          <MapPin size={8} className="shrink-0" />
                          <span className="truncate">
                            {appt.room ? `R${appt.room.number}` : '—'} · {appt.therapist?.name || ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}