import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import type { AppointmentStatus, Prisma } from '@prisma/client';
import { createNotification, notifyRole, NOTIFICATION_TYPES } from './notification.service.js';

export interface CreateAppointmentData {
  patientId: string;
  therapistId: string;
  roomId?: string;
  dateTime: Date;
  duration?: number;
  notes?: string;
}

function intervalsOverlap(
  existingStart: number,
  existingEnd: number,
  newStart: number,
  newEnd: number,
): boolean {
  return existingStart < newEnd && existingEnd > newStart;
}

async function checkTherapistConcurrency(
  therapistId: string,
  newStart: Date,
  newDuration: number,
  excludeId?: string,
): Promise<void> {
  const newStartMs = newStart.getTime();
  const newEndMs = newStartMs + newDuration * 60000;
  const windowStart = new Date(newStartMs - 8 * 3600000);
  const windowEnd = new Date(newStartMs + 8 * 3600000);

  const where: Prisma.AppointmentWhereInput = {
    therapistId,
    status: { in: ['PENDING', 'CONFIRMED'] },
    dateTime: { gte: windowStart, lte: windowEnd },
    ...(excludeId && { id: { not: excludeId } }),
  };

  const existing = await prisma.appointment.findMany({
    where,
    select: { dateTime: true, duration: true },
  });

  let concurrentCount = 0;

  for (const appt of existing) {
    const eStart = appt.dateTime.getTime();
    const eEnd = eStart + appt.duration * 60000;

    if (intervalsOverlap(eStart, eEnd, newStartMs, newEndMs)) {
      concurrentCount++;
    }
  }

  if (concurrentCount >= 2) {
    throw new HttpError(
      409,
      'This therapist already has 2 concurrent appointments at this time',
    );
  }
}

async function checkRoomAvailability(
  roomId: string,
  newStart: Date,
  newDuration: number,
  excludeId?: string,
): Promise<void> {
  const newStartMs = newStart.getTime();
  const newEndMs = newStartMs + newDuration * 60000;
  const windowStart = new Date(newStartMs - 8 * 3600000);
  const windowEnd = new Date(newStartMs + 8 * 3600000);

  const where: Prisma.AppointmentWhereInput = {
    roomId,
    status: { in: ['PENDING', 'CONFIRMED'] },
    dateTime: { gte: windowStart, lte: windowEnd },
    ...(excludeId && { id: { not: excludeId } }),
  };

  const existing = await prisma.appointment.findMany({
    where,
    select: { dateTime: true, duration: true },
  });

  for (const appt of existing) {
    const eStart = appt.dateTime.getTime();
    const eEnd = eStart + appt.duration * 60000;

    if (intervalsOverlap(eStart, eEnd, newStartMs, newEndMs)) {
      throw new HttpError(
        409,
        'This room is already booked at the selected time',
      );
    }
  }
}

const VALID_STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED', 'NO_SHOW'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const appointmentInclude = {
  patient: { select: { id: true, name: true, phone: true } },
  therapist: { select: { id: true, name: true } },
  room: { select: { id: true, number: true, name: true } },
} as const;

export async function listAppointments(filters: {
  date?: Date;
  therapistId?: string;
  patientId?: string;
  status?: AppointmentStatus;
  page: number;
  limit: number;
}) {
  const where: Prisma.AppointmentWhereInput = {};

  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);

    where.dateTime = { gte: start, lte: end };
  }

  if (filters.therapistId) where.therapistId = filters.therapistId;
  if (filters.patientId) where.patientId = filters.patientId;
  if (filters.status) where.status = filters.status;

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: { dateTime: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    data: appointments,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  };
}

export async function getAppointmentById(id: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      ...appointmentInclude,
      therapySessions: {
        select: {
          id: true,
          diagnosis: true,
          createdAt: true,
        },
      },
      invoices: {
        select: {
          id: true,
          number: true,
          total: true,
          status: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new HttpError(404, 'Appointment not found');
  }

  return appointment;
}

export async function createAppointment(data: CreateAppointmentData) {
  const patient = await prisma.patient.findUnique({
    where: { id: data.patientId },
  });

  if (!patient) {
    throw new HttpError(404, 'Patient not found');
  }

  const therapist = await prisma.user.findUnique({
    where: { id: data.therapistId },
  });

  if (!therapist) {
    throw new HttpError(404, 'Therapist not found');
  }

  if (therapist.role !== 'THERAPIST') {
    throw new HttpError(400, 'Selected user is not a therapist');
  }

  if (!therapist.isActive) {
    throw new HttpError(400, 'This therapist is not active');
  }

  if (data.roomId) {
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
    });

    if (!room) {
      throw new HttpError(404, 'Room not found');
    }
  }

  const appointmentStart = new Date(data.dateTime);

  if (isNaN(appointmentStart.getTime())) {
    throw new HttpError(400, 'Invalid date/time format');
  }

  if (appointmentStart < new Date()) {
    throw new HttpError(400, 'Cannot book appointments in the past');
  }

  const duration = data.duration ?? 45;

  if (duration < 15 || duration > 240) {
    throw new HttpError(
      400,
      'Duration must be between 15 and 240 minutes',
    );
  }

  await checkTherapistConcurrency(
    data.therapistId,
    appointmentStart,
    duration,
  );

  if (data.roomId) {
    await checkRoomAvailability(
      data.roomId,
      appointmentStart,
      duration,
    );
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      therapistId: data.therapistId,
      roomId: data.roomId ?? null,
      dateTime: appointmentStart,
      duration,
      notes: data.notes ?? null,
      status: 'PENDING',
    },
    include: appointmentInclude,
  });

  // ─── Send notifications ───

  // Notify the therapist
  await createNotification({
    userId: data.therapistId,
    type: NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
    title: 'New Appointment Booked',
    message: `${patient.name} booked an appointment on ${appointmentStart.toLocaleString()}`,
    link: '/appointments',
  });

  // Notify all secretaries and owners
  await notifyRole('SECRETARY', {
    type: NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
    title: 'New Appointment',
    message: `${patient.name} with ${therapist.name} on ${appointmentStart.toLocaleString()}`,
    link: '/appointments',
  });

  await notifyRole('OWNER', {
    type: NOTIFICATION_TYPES.APPOINTMENT_BOOKED,
    title: 'New Appointment',
    message: `${patient.name} with ${therapist.name} on ${appointmentStart.toLocaleString()}`,
    link: '/appointments',
  });

  return appointment;
}

export async function updateAppointment(
  id: string,
  data: Partial<CreateAppointmentData> & { status?: AppointmentStatus },
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new HttpError(404, 'Appointment not found');
  }

  const terminalStatuses: AppointmentStatus[] = [
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ];

  if (terminalStatuses.includes(appointment.status)) {
    throw new HttpError(
      400,
      'Cannot update a ' + appointment.status.toLowerCase() + ' appointment',
    );
  }

  if (data.dateTime || data.duration || data.roomId !== undefined) {
    const newStart = data.dateTime
      ? new Date(data.dateTime)
      : appointment.dateTime;

    const newDuration = data.duration ?? appointment.duration;

    if (newStart < new Date() && data.dateTime) {
      throw new HttpError(400, 'Cannot reschedule to a past time');
    }

    await checkTherapistConcurrency(
      appointment.therapistId,
      newStart,
      newDuration,
      id,
    );

    const roomId =
      data.roomId !== undefined ? data.roomId : appointment.roomId;

    if (roomId) {
      await checkRoomAvailability(
        roomId,
        newStart,
        newDuration,
        id,
      );
    }
  }

  if (data.status && data.status !== appointment.status) {
    const allowed = VALID_STATUS_TRANSITIONS[appointment.status];

    if (!allowed.includes(data.status)) {
      throw new HttpError(
        400,
        'Cannot change status from ' +
          appointment.status +
          ' to ' +
          data.status,
      );
    }
  }

  return prisma.appointment.update({
    where: { id },
    data: {
      ...(data.dateTime && { dateTime: new Date(data.dateTime) }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.roomId !== undefined && { roomId: data.roomId }),
      ...(data.status && { status: data.status }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: appointmentInclude,
  });
}

export async function changeAppointmentStatus(
  id: string,
  newStatus: AppointmentStatus,
) {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!appointment) {
    throw new HttpError(404, 'Appointment not found');
  }

  const allowed = VALID_STATUS_TRANSITIONS[appointment.status];

  if (!allowed || !allowed.includes(newStatus)) {
    throw new HttpError(
      400,
      'Cannot change status from ' +
        appointment.status +
        ' to ' +
        newStatus,
    );
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: newStatus },
    include: appointmentInclude,
  });

  // Auto-deduct from patient's active package
  if (newStatus === 'COMPLETED') {
    const { useSession } = await import('./package.service.js');
    const packageResult = await useSession(
      appointment.patientId,
      id,
    );

    if (packageResult.used) {
      // Notify secretary about package usage
      await prisma.notification.create({
        data: {
          userId: appointment.therapistId,
          type: 'PACKAGE_SESSION_USED',
          title: 'Package Session Used',
          message: `Session deducted from ${packageResult.package.name}. ${packageResult.package.sessionsRemaining} remaining.`,
        },
      });
    }
  }

  // Check waitlist for this cancelled slot
  if (newStatus === 'CANCELLED') {
    const { notifyWaitlistForCancelledSlot } = await import(
      './waitlist.service.js'
    );

    await notifyWaitlistForCancelledSlot(
      appointment.dateTime,
      appointment.therapistId,
      appointment.roomId ?? undefined,
    );
  }

  // ─── Send notifications ───

  // If confirmed or cancelled, notify the patient
  // (if they have a user account)
  if (newStatus === 'CONFIRMED' || newStatus === 'CANCELLED') {
    const patientWithUser = await prisma.patient.findUnique({
      where: { id: appointment.patientId },
      include: { user: true },
    });

    if (patientWithUser?.user) {
      const statusText =
        newStatus === 'CONFIRMED' ? 'confirmed' : 'cancelled';

      await createNotification({
        userId: patientWithUser.user.id,
        type:
          newStatus === 'CONFIRMED'
            ? NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED
            : NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
        title: `Appointment ${statusText}`,
        message: `Your appointment with ${appointment.therapistId} on ${appointment.dateTime.toLocaleString()} has been ${statusText}`,
        link: '/appointments',
      });
    }
  }

  return updated;
}
