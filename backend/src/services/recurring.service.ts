// backend/src/services/recurring.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { checkTherapistConcurrency, checkRoomAvailability } from './appointment.service.js';

export interface CreateRecurringData {
  patientId: string;
  therapistId: string;
  roomId?: string;
  startDate: Date; // First appointment date
  frequency: 'WEEKLY' | 'BIWEEKLY';
  daysOfWeek: number[]; // 0=Sun, 1=Mon, etc.
  sessionCount: number; // Total sessions to create
  duration?: number;
  notes?: string;
}

export async function createRecurringAppointments(data: CreateRecurringData) {
  // Validate
  if (data.sessionCount < 2) {
    throw new HttpError(400, 'Recurring appointments require at least 2 sessions');
  }
  if (data.sessionCount > 50) {
    throw new HttpError(400, 'Cannot create more than 50 sessions at once');
  }
  if (data.daysOfWeek.length === 0) {
    throw new HttpError(400, 'At least one day of week is required');
  }

  // Validate patient and therapist
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new HttpError(404, 'Patient not found');

  const therapist = await prisma.user.findUnique({ where: { id: data.therapistId } });
  if (!therapist || therapist.role !== 'THERAPIST') {
    throw new HttpError(400, 'Invalid therapist');
  }

  // Generate all appointment dates
  const appointments: Array<{ dateTime: Date }> = [];
  const currentDate = new Date(data.startDate);

  // Set time to 9 AM if not specified
  if (currentDate.getHours() === 0 && currentDate.getMinutes() === 0) {
    currentDate.setHours(9, 0, 0, 0);
  }

  // Adjust to first valid day
  while (!data.daysOfWeek.includes(currentDate.getDay())) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const intervalWeeks = data.frequency === 'BIWEEKLY' ? 2 : 1;
  let weekCount = 0;

  // Generate sessions
  while (appointments.length < data.sessionCount) {
    if (data.daysOfWeek.includes(currentDate.getDay())) {
      // Only add if it's the correct week in the interval
      const currentWeek = Math.floor(appointments.length / data.daysOfWeek.length);
      if (currentWeek % intervalWeeks === 0) {
        appointments.push({ dateTime: new Date(currentDate) });
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);

    // Prevent infinite loop
    if (appointments.length === 0 && currentDate > new Date(data.startDate.getTime() + 365 * 24 * 60 * 60 * 1000)) {
      throw new HttpError(400, 'Could not generate appointments within 1 year');
    }
  }

  // Check conflicts for all appointments
  const conflicts: string[] = [];
  for (const appt of appointments) {
    try {
      await checkTherapistConcurrency(data.therapistId, appt.dateTime, data.duration || 45);
      if (data.roomId) {
        await checkRoomAvailability(data.roomId, appt.dateTime, data.duration || 45);
      }
    } catch (error) {
      conflicts.push(
        `${appt.dateTime.toLocaleDateString()} ${appt.dateTime.toLocaleTimeString()}`,
      );
    }
  }

  if (conflicts.length > 0) {
    throw new HttpError(409, `Conflicts detected: ${conflicts.join(', ')}`);
  }

  // Create recurring pattern
  const pattern = await prisma.recurringPattern.create({
    data: {
      frequency: data.frequency,
      daysOfWeek: data.daysOfWeek,
      sessionCount: data.sessionCount,
      startDate: data.startDate,
      endDate: appointments[appointments.length - 1].dateTime,
    },
  });

  // Create all appointments
  const createdAppointments = [];
  for (let i = 0; i < appointments.length; i++) {
    const appt = await prisma.appointment.create({
      data: {
        patientId: data.patientId,
        therapistId: data.therapistId,
        roomId: data.roomId ?? null,
        dateTime: appointments[i].dateTime,
        duration: data.duration ?? 45,
        notes: i === 0 ? (data.notes ?? null) : null, // Notes on first session only
        status: 'PENDING',
        recurringPatternId: pattern.id,
      },
      include: {
        patient: { select: { name: true } },
        therapist: { select: { name: true } },
        room: { select: { number: true } },
      },
    });
    createdAppointments.push(appt);
  }

  // Update pattern with parent appointment
  await prisma.recurringPattern.update({
    where: { id: pattern.id },
    data: { parentAppointmentId: createdAppointments[0].id },
  });

  return {
    pattern,
    appointments: createdAppointments,
    summary: {
      totalSessions: createdAppointments.length,
      firstSession: createdAppointments[0].dateTime,
      lastSession: createdAppointments[createdAppointments.length - 1].dateTime,
    },
  };
}

export async function cancelRecurringSeries(patternId: string, cancelFuture: boolean) {
  const pattern = await prisma.recurringPattern.findUnique({
    where: { id: patternId },
  });
  if (!pattern) throw new HttpError(404, 'Recurring pattern not found');

  if (cancelFuture) {
    // Cancel all future pending/confirmed appointments in this series
    await prisma.appointment.updateMany({
      where: {
        recurringPatternId: patternId,
        dateTime: { gte: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      data: { status: 'CANCELLED' },
    });
  } else {
    // Cancel all appointments in series
    await prisma.appointment.updateMany({
      where: { recurringPatternId: patternId },
      data: { status: 'CANCELLED' },
    });
  }

  return { success: true, cancelled: true };
}

export async function getRecurringPatterns(patientId?: string) {
  let patternIds: string[] | undefined = undefined;

  if (patientId) {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        recurringPatternId: { not: null },
      },
      select: { recurringPatternId: true },
    });
    patternIds = [...new Set(appointments.map((a) => a.recurringPatternId as string))];
  }

  const patterns = await prisma.recurringPattern.findMany({
    where: patternIds ? { id: { in: patternIds } } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  const result = [];
  for (const pattern of patterns) {
    const nextAppointments = await prisma.appointment.findMany({
      where: {
        recurringPatternId: pattern.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      take: 1,
      include: {
        patient: { select: { id: true, name: true } },
        therapist: { select: { id: true, name: true } },
      },
      orderBy: { dateTime: 'asc' },
    });
    result.push({
      ...pattern,
      appointments: nextAppointments,
    });
  }

  return result;
}