import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { StarRating } from '../../components/StarRating';
import { usePatientAuth } from '../../store/patient-auth';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Check,
  AlertCircle,
  Loader2,
  Stethoscope,
} from 'lucide-react';

import api from '../../lib/api';
import { useI18n } from '../../i18n';
import { Card, EmptyState } from '../../components/ui';

interface Therapist {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface Appointment {
  id: string;
  therapistId: string;
  dateTime: string;
  duration: number;
  status: string;
  roomId: string | null;
}

interface TherapistRating {
  average: number | null;
  count: number;
}

const SLOT_DURATION = 60;
const WORKING_START = 9;
const WORKING_END = 22;

function generateTimeSlots(): string[] {
  const slots: string[] = [];

  const start = new Date();
  start.setHours(WORKING_START, 0, 0, 0);

  const end = new Date();
  end.setHours(WORKING_END, 0, 0, 0);

  while (start < end) {
    slots.push(start.toTimeString().slice(0, 5));
    start.setMinutes(start.getMinutes() + SLOT_DURATION);
  }

  return slots;
}

const TIME_SLOTS = generateTimeSlots();

function formatSlotTime(slot: string, lang: string): string {
  const [hours, minutes] = slot.split(':').map(Number);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString(
    lang === 'ar' ? 'ar-EG' : 'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    },
  );
}

// ─── Calendar component ───

function SimpleCalendar({
  selectedDate,
  onSelectDate,
  lang,
}: {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  lang: string;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );

  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );

  const startDate = new Date(monthStart);
  const endDate = new Date(monthEnd);

  // Adjust to start on Sunday (or Saturday for Arabic)
  const startDay = lang === 'ar' ? 6 : 0;

  while (startDate.getDay() !== startDay) {
    startDate.setDate(startDate.getDate() - 1);
  }

  while (endDate.getDay() !== (startDay + 6) % 7) {
    endDate.setDate(endDate.getDate() + 1);
  }

  const days: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const weekDays =
    lang === 'ar'
      ? ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthNames =
    lang === 'ar'
      ? [
          'يناير',
          'فبراير',
          'مارس',
          'أبريل',
          'مايو',
          'يونيو',
          'يوليو',
          'أغسطس',
          'سبتمبر',
          'أكتوبر',
          'نوفمبر',
          'ديسمبر',
        ]
      : [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ];

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);

    if (
      next <=
      new Date(today.getFullYear(), today.getMonth() + 2, 0)
    ) {
      setCurrentMonth(next);
    }
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);

    if (
      prev >=
      new Date(today.getFullYear(), today.getMonth(), 1)
    ) {
      setCurrentMonth(prev);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Month header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100"
          disabled={currentMonth.getMonth() === today.getMonth()}
        >
          <ChevronLeft
            size={20}
            className={lang === 'ar' ? 'rotate-180' : ''}
          />
        </button>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {monthNames[currentMonth.getMonth()]}{' '}
          {currentMonth.getFullYear()}
        </h3>

        <button
          onClick={nextMonth}
          className="rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100"
        >
          <ChevronRight
            size={20}
            className={lang === 'ar' ? 'rotate-180' : ''}
          />
        </button>
      </div>

      {/* Week day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isPast = day < today;
          const isCurrentMonth =
            day.getMonth() === currentMonth.getMonth();

          const isSelected =
            selectedDate &&
            day.toDateString() === selectedDate.toDateString();

          const isToday =
            day.toDateString() === today.toDateString();

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && onSelectDate(day)}
              disabled={isPast}
              className={`
                relative flex h-12 w-full items-center justify-center rounded-lg text-sm font-medium transition-all
                ${
                  isPast
                    ? 'cursor-not-allowed text-gray-300'
                    : 'cursor-pointer hover:bg-primary-50'
                }
                ${
                  !isCurrentMonth
                    ? 'text-gray-300'
                    : isPast
                      ? 'text-gray-300'
                      : 'text-gray-700 dark:text-gray-300'
                }
                ${
                  isToday && !isSelected
                    ? 'border-2 border-primary-500'
                    : ''
                }
                ${
                  isSelected
                    ? 'bg-primary-600 text-white shadow-md'
                    : ''
                }
              `}
            >
              {day.getDate()}

              {isToday && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───

export default function PatientBooking() {
  const { t, lang } = useI18n();
  const { patient } = usePatientAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!patient) navigate('/portal/login');
  }, [patient, navigate]);

  const L = (arText: string, enText: string) =>
    lang === 'ar' ? arText : enText;

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedTherapist, setSelectedTherapist] =
    useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] =
    useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch therapists ───

  const {
    data: therapists,
    isLoading: therapistsLoading,
  } = useQuery({
    queryKey: ['portal-therapists'],
    queryFn: async () => {
      const res = await api.get('/portal/therapists');
      return res.data as Therapist[];
    },
    enabled: !!patient,
  });

  // ─── Fetch ratings for all therapists ───

  const { data: therapistRatings } = useQuery({
    queryKey: ['therapist-ratings'],
    queryFn: async () => {
      const therapistIds = (therapists || []).map(
        (therapist) => therapist.id,
      );

      if (therapistIds.length === 0) {
        return {};
      }

      const results = await Promise.all(
        therapistIds.map(async (id) => {
          const res = await api.get(
            `/ratings/therapist/${id}`,
          );

          return {
            id,
            ...res.data,
          };
        }),
      );

      return results.reduce(
        (acc, rating) => {
          acc[rating.id] = {
            average: rating.average,
            count: rating.count,
          };

          return acc;
        },
        {} as Record<string, TherapistRating>,
      );
    },
    enabled:
      !!therapists && therapists.length > 0,
  });

  // ─── Fetch appointments for selected date + therapist ───

  const {
    data: availabilityData,
    isLoading: apptLoading,
  } = useQuery({
    queryKey: [
      'booking-appointments',
      selectedDate?.toISOString(),
      selectedTherapist?.id,
    ],
    queryFn: async () => {
      if (!selectedDate || !selectedTherapist) {
        return { appointments: [], maxConcurrentRooms: 5 };
      }

      const dateStr = selectedDate
        .toISOString()
        .split('T')[0];

      const res = await api.get('/portal/appointments/availability', {
        params: {
          date: dateStr,
        },
      });

      return {
        appointments: res.data.data as Appointment[],
        maxConcurrentRooms: res.data.maxConcurrentRooms as number,
      };
    },
    enabled:
      !!selectedDate && !!selectedTherapist,
  });

  const dayAppointments = availabilityData?.appointments;
  const maxConcurrentRooms = availabilityData?.maxConcurrentRooms ?? 5;

  // ─── Calculate available slots ───

  const slotAvailability = useMemo(() => {
    if (!dayAppointments) {
      return TIME_SLOTS.map(() => ({
        available: true,
        count: 0,
      }));
    }

    return TIME_SLOTS.map((slot) => {
      const [hours, minutes] = slot
        .split(':')
        .map(Number);

      const slotStart = new Date(selectedDate!);

      slotStart.setHours(
        hours,
        minutes,
        0,
        0,
      );

      const slotEnd = new Date(
        slotStart.getTime() +
          SLOT_DURATION * 60000,
      );

      let therapistCount = 0;
      let globalCount = 0;

      for (const appt of dayAppointments) {
        const apptStart = new Date(
          appt.dateTime,
        );

        const apptEnd = new Date(
          apptStart.getTime() +
            appt.duration * 60000,
        );

        if (
          apptStart < slotEnd &&
          apptEnd > slotStart
        ) {
          globalCount++;
          if (appt.therapistId === selectedTherapist?.id) {
            therapistCount++;
          }
        }
      }

      const available = therapistCount < 2 && globalCount < maxConcurrentRooms;

      return {
        available,
        count: therapistCount,
      };
    });
  }, [dayAppointments, selectedDate, maxConcurrentRooms, selectedTherapist]);

  // ─── Create appointment mutation ───

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (
        !selectedTherapist ||
        !selectedDate ||
        !selectedSlot
      ) {
        return;
      }

      const [hours, minutes] = selectedSlot
        .split(':')
        .map(Number);

      const dateTime = new Date(selectedDate);

      dateTime.setHours(
        hours,
        minutes,
        0,
        0,
      );

      await api.post('/portal/appointments', {
        therapistId: selectedTherapist.id,
        dateTime: dateTime.toISOString(),
        duration: SLOT_DURATION,
      });
    },

    onSuccess: () => {
      setBookingSuccess(true);
      setStep(4);
    },

    onError: (err: any) => {
      setError(
        err.response?.data?.message ||
          L('فشل الحجز', 'Booking failed'),
      );
    },
  });

  // Reset error when step changes
  useEffect(() => {
    setError(null);
  }, [step]);

  const handleBook = () => {
    setError(null);
    createAppointment.mutate();
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedTherapist(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookingSuccess(false);
    setError(null);
  };

  // ─── Step indicators ───

  const steps = [
    {
      num: 1,
      label: L(
        'اختر الأخصائي',
        'Select Therapist',
      ),
    },
    {
      num: 2,
      label: L(
        'اختر التاريخ',
        'Select Date',
      ),
    },
    {
      num: 3,
      label: L(
        'اختر الوقت',
        'Select Time',
      ),
    },
    {
      num: 4,
      label: L(
        'تأكيد',
        'Confirm',
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {L(
            'حجز موعد جديد',
            'Book New Appointment',
          )}
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {L(
            'اختر الأخصائي والوقت المناسب لك',
            'Choose a therapist and time that works for you',
          )}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center">
        {steps.map((s, i) => (
          <div
            key={s.num}
            className="flex items-center"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step > s.num
                  ? 'bg-green-500 text-white'
                  : step === s.num
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-500 dark:text-gray-400'
              }`}
            >
              {step > s.num ? (
                <Check size={16} />
              ) : (
                s.num
              )}
            </div>

            {i < steps.length - 1 && (
              <div
                className={`h-1 w-12 sm:w-20 ${
                  step > s.num + 1
                    ? 'bg-green-500'
                    : step > s.num
                      ? 'bg-primary-400'
                      : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step labels */}
      <div className="flex justify-center gap-4 sm:gap-8">
        {steps.map((s) => (
          <span
            key={s.num}
            className={`hidden text-xs font-medium sm:block ${
              step === s.num
                ? 'text-primary-600'
                : 'text-gray-400'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── STEP 1: Select Therapist ─── */}

      {step === 1 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Stethoscope
              size={20}
              className="text-primary-600"
            />

            {L(
              'اختر أخصائي العلاج',
              'Choose Your Therapist',
            )}
          </h2>

          {therapistsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (therapists || []).length === 0 ? (
            <EmptyState
              message={L(
                'لا يوجد أخصائيون متاحون',
                'No therapists available',
              )}
            />
          ) : (
            <div className="space-y-3">
              {(therapists || []).map(
                (therapist) => (
                  <button
                    key={therapist.id}
                    onClick={() => {
                      setSelectedTherapist(
                        therapist,
                      );
                      setStep(2);
                    }}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-start transition-all hover:border-primary-300 hover:bg-primary-50 ${
                      selectedTherapist?.id ===
                      therapist.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Therapist avatar */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-xl font-semibold text-blue-600">
                      {therapist.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    {/* Therapist information + rating */}
                    <div className="flex-1">
                      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {therapist.name}
                      </p>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {L(
                          'أخصائي علاج طبيعي',
                          'Physiotherapist',
                        )}
                      </p>

                      {/* Rating */}
                      <div className="mt-1">
                        {therapistRatings?.[
                          therapist.id
                        ]?.average !== null &&
                        therapistRatings?.[
                          therapist.id
                        ]?.average !==
                          undefined ? (
                          <StarRating
                            value={Math.round(
                              therapistRatings[
                                therapist.id
                              ].average!,
                            )}
                            size={14}
                            showValue={true}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            {L(
                              'لا تقييمات بعد',
                              'No ratings yet',
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      size={20}
                      className={`shrink-0 text-gray-400 ${
                        lang === 'ar'
                          ? 'rotate-180'
                          : ''
                      }`}
                    />
                  </button>
                ),
              )}
            </div>
          )}
        </Card>
      )}

      {/* ─── STEP 2: Select Date ─── */}

      {step === 2 && selectedTherapist && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <CalendarIcon
              size={20}
              className="text-primary-600"
            />

            {L(
              'اختر التاريخ',
              'Select Date',
            )}
          </h2>

          <div className="mb-4 flex items-center gap-3 rounded-lg bg-blue-50 p-3">
            <User
              size={18}
              className="text-blue-600"
            />

            <div>
              <p className="text-sm font-medium text-blue-900">
                {L(
                  'الأخصائي المختار',
                  'Selected Therapist',
                )}
                :
              </p>

              <p className="text-sm text-blue-700">
                {selectedTherapist.name}
              </p>
            </div>
          </div>

          <SimpleCalendar
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setStep(3);
            }}
            lang={lang}
          />

          <button
            onClick={() => setStep(1)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
          >
            <ChevronLeft
              size={16}
              className={
                lang === 'ar'
                  ? 'rotate-180'
                  : ''
              }
            />

            {L(
              'تغيير الأخصائي',
              'Change Therapist',
            )}
          </button>
        </Card>
      )}

      {/* ─── STEP 3: Select Time Slot ─── */}

      {step === 3 &&
        selectedTherapist &&
        selectedDate && (
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Clock
                size={20}
                className="text-primary-600"
              />

              {L(
                'اختر الوقت المتاح',
                'Select Available Time',
              )}
            </h2>

            {/* Summary bar */}
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50 dark:bg-gray-900 p-3 text-sm">
              <div className="flex items-center gap-2">
                <User
                  size={16}
                  className="text-gray-500 dark:text-gray-400"
                />

                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedTherapist.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarIcon
                  size={16}
                  className="text-gray-500 dark:text-gray-400"
                />

                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedDate.toLocaleDateString(
                    lang === 'ar'
                      ? 'ar-EG'
                      : 'en-US',
                    {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    },
                  )}
                </span>
              </div>
            </div>

            {apptLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : (
              <>
                {/* Time slots grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {TIME_SLOTS.map(
                    (slot, index) => {
                      const availability =
                        slotAvailability[index];

                      const isPast =
                        selectedDate.toDateString() ===
                          new Date().toDateString() &&
                        new Date().getTime() >
                          new Date(
                            selectedDate,
                          ).setHours(
                            parseInt(
                              slot.split(':')[0],
                            ),
                            parseInt(
                              slot.split(':')[1],
                            ),
                          );

                      const isDisabled =
                        !availability.available ||
                        isPast;

                      const isSelected =
                        selectedSlot === slot;

                      return (
                        <button
                          key={slot}
                          onClick={() =>
                            !isDisabled &&
                            setSelectedSlot(
                              slot,
                            )
                          }
                          disabled={isDisabled}
                          className={`
                            flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all
                            ${
                              isDisabled
                                ? 'cursor-not-allowed border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-300'
                                : isSelected
                                  ? 'border-primary-500 bg-primary-600 text-white shadow-lg'
                                  : 'cursor-pointer border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:bg-primary-50'
                            }
                          `}
                        >
                          <span className="text-base font-semibold">
                            {formatSlotTime(
                              slot,
                              lang,
                            )}
                          </span>

                          <span className="mt-1 text-xs">
                            {isDisabled
                              ? isPast
                                ? L(
                                    'مضى',
                                    'Past',
                                  )
                                : L(
                                    'محجوز',
                                    'Full',
                                  )
                              : availability.count ===
                                  1
                                ? L(
                                    'مكان واحد متاح',
                                    '1 spot left',
                                  )
                                : L(
                                    'متاح',
                                    'Available',
                                  )}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>

                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-primary-600" />
                    <span>
                      {L(
                        'متاح',
                        'Available',
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-300" />
                    <span>
                      {L(
                        'محجوز / مضى',
                        'Full / Past',
                      )}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                  >
                    <ChevronLeft
                      size={16}
                      className={
                        lang === 'ar'
                          ? 'rotate-180'
                          : ''
                      }
                    />

                    {L(
                      'تغيير التاريخ',
                      'Change Date',
                    )}
                  </button>

                  <button
                    onClick={() => setStep(4)}
                    disabled={!selectedSlot}
                    className="btn-primary"
                  >
                    {L(
                      'متابعة',
                      'Continue',
                    )}
                  </button>
                </div>
              </>
            )}
          </Card>
        )}

      {/* ─── STEP 4: Confirm / Success ─── */}

      {step === 4 &&
        selectedTherapist &&
        selectedDate &&
        selectedSlot &&
        !bookingSuccess && (
          <Card>
            <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Check
                size={20}
                className="text-primary-600"
              />

              {L(
                'تأكيد الحجز',
                'Confirm Booking',
              )}
            </h2>

            {/* Booking summary */}
            <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-2xl font-semibold text-blue-600">
                  {selectedTherapist.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {selectedTherapist.name}
                  </p>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {L(
                      'أخصائي علاج طبيعي',
                      'Physiotherapist',
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg bg-white dark:bg-gray-800 p-4">
                  <CalendarIcon
                    size={20}
                    className="text-primary-600"
                  />

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {L(
                        'التاريخ',
                        'Date',
                      )}
                    </p>

                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedDate.toLocaleDateString(
                        lang === 'ar'
                          ? 'ar-EG'
                          : 'en-US',
                        {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        },
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg bg-white dark:bg-gray-800 p-4">
                  <Clock
                    size={20}
                    className="text-primary-600"
                  />

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {L(
                        'الوقت',
                        'Time',
                      )}
                    </p>

                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatSlotTime(
                        selectedSlot,
                        lang,
                      )}{' '}
                      ({SLOT_DURATION}{' '}
                      {L('دقيقة', 'min')})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft
                  size={16}
                  className={
                    lang === 'ar'
                      ? 'rotate-180'
                      : ''
                  }
                />

                {L(
                  'تغيير الوقت',
                  'Change Time',
                )}
              </button>

              <button
                onClick={handleBook}
                disabled={
                  createAppointment.isPending
                }
                className="btn-primary"
              >
                {createAppointment.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />

                    {L(
                      'جاري الحجز...',
                      'Booking...',
                    )}
                  </span>
                ) : (
                  L(
                    'تأكيد الحجز',
                    'Confirm Booking',
                  )
                )}
              </button>
            </div>
          </Card>
        )}

      {/* ─── Success State ─── */}

      {bookingSuccess && (
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check
              size={40}
              className="text-green-600"
            />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L(
              'تم الحجز بنجاح!',
              'Booking Confirmed!',
            )}
          </h2>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {L(
              'سنراك قريباً. تم إرسال التفاصيل إلى حسابك.',
              "We'll see you soon. Details have been sent to your account.",
            )}
          </p>

          {selectedDate &&
            selectedSlot && (
              <div className="mx-auto mt-6 max-w-xs rounded-xl bg-primary-50 p-4">
                <p className="text-sm font-medium text-primary-700">
                  {selectedDate.toLocaleDateString(
                    lang === 'ar'
                      ? 'ar-EG'
                      : 'en-US',
                    {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    },
                  )}{' '}
                  at{' '}
                  {formatSlotTime(
                    selectedSlot,
                    lang,
                  )}
                </p>

                {selectedTherapist && (
                  <p className="mt-1 text-sm text-primary-600">
                    {L(
                      'مع',
                      'with',
                    )}{' '}
                    {selectedTherapist.name}
                  </p>
                )}
              </div>
            )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={resetBooking}
              className="btn-primary"
            >
              {L(
                'حجز موعد آخر',
                'Book Another',
              )}
            </button>

            <a
              href="/appointments"
              className="btn-secondary"
            >
              {L(
                'عرض مواعيدي',
                'View My Appointments',
              )}
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
