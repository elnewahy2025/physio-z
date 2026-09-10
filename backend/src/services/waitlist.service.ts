// backend/src/services/waitlist.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { notificationEmitter } from '../lib/notification-emitter.js';

export async function addToWaitlist(data: {
  patientId: string;
  preferredDate: Date;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  therapistId?: string;
  priority?: number;
  notes?: string;
}) {
  // Validate patient
  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
  if (!patient) throw new HttpError(404, 'Patient not found');

  // Check if already on waitlist for same date
  const existing = await prisma.waitlistEntry.findFirst({
    where: {
      patientId: data.patientId,
      preferredDate: data.preferredDate,
      status: 'WAITING',
    },
  });
  if (existing) {
    throw new HttpError(409, 'Patient already on waitlist for this date');
  }

  return prisma.waitlistEntry.create({
    data: {
      ...data,
      priority: data.priority ?? 0,
      status: 'WAITING',
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      therapist: { select: { id: true, name: true } },
    },
  });
}

export async function listWaitlist(status?: string) {
  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  else where.status = 'WAITING';

  return prisma.waitlistEntry.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      therapist: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function removeFromWaitlist(id: string) {
  const entry = await prisma.waitlistEntry.findUnique({ where: { id } });
  if (!entry) throw new HttpError(404, 'Waitlist entry not found');
  await prisma.waitlistEntry.delete({ where: { id } });
  return { success: true };
}

// ─── Check waitlist when appointment is cancelled ───
export async function notifyWaitlistForCancelledSlot(
  cancelledDateTime: Date,
  therapistId: string,
  roomId?: string,
) {
  const cancelledDate = new Date(cancelledDateTime);
  const dateStr = cancelledDate.toISOString().split('T')[0];
  const timeStr = `${String(cancelledDate.getHours()).padStart(2, '0')}:${String(cancelledDate.getMinutes()).padStart(2, '0')}`;

  // Find waitlist entries for this date, time range, and therapist
  const matchingEntries = await prisma.waitlistEntry.findMany({
    where: {
      status: 'WAITING',
      preferredDate: new Date(dateStr),
      preferredTimeStart: { lte: timeStr },
      preferredTimeEnd: { gte: timeStr },
      OR: [
        { therapistId: null }, // Any therapist
        { therapistId }, // Specific therapist
      ],
    },
    include: {
      patient: { include: { user: true } },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: 3, // Notify top 3 matches
  });

  let notified = 0;
  for (const entry of matchingEntries) {
    if (entry.patient.user) {
      await prisma.notification.create({
        data: {
          userId: entry.patient.user.id,
          type: 'WAITLIST_SLOT_OPEN',
          title: 'Slot Available!',
          message: `A slot opened on ${cancelledDate.toLocaleDateString()} at ${timeStr}. Book now!`,
          link: '/book',
        },
      });
      notified++;
    }

    // Update entry status
    await prisma.waitlistEntry.update({
      where: { id: entry.id },
      data: {
        status: 'NOTIFIED',
        notifiedAt: new Date(),
      },
    });
  }

  // Notify secretary about waitlist matches
  const secretaries = await prisma.user.findMany({
    where: { role: 'SECRETARY', isActive: true },
  });

  for (const secretary of secretaries) {
    await prisma.notification.create({
      data: {
        userId: secretary.id,
        type: 'WAITLIST_MATCH',
        title: 'Waitlist Match',
        message: `${notified} waitlisted patients match the cancelled slot. Contact them to book.`,
        link: '/waitlist',
      },
    });
  }

  return { notified, totalMatches: matchingEntries.length };
}

// ─── Book from waitlist ───
export async function bookFromWaitlist(waitlistId: string, appointmentData: {
  therapistId: string;
  roomId?: string;
  dateTime: Date;
  duration?: number;
}) {
  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: waitlistId },
    include: { patient: true },
  });
  if (!entry) throw new HttpError(404, 'Waitlist entry not found');
  if (entry.status !== 'WAITING' && entry.status !== 'NOTIFIED') {
    throw new HttpError(400, 'Entry is no longer available');
  }

  // Create appointment
  const appointment = await prisma.appointment.create({
    data: {
      patientId: entry.patientId,
      therapistId: appointmentData.therapistId,
      roomId: appointmentData.roomId ?? null,
      dateTime: appointmentData.dateTime,
      duration: appointmentData.duration ?? 45,
      status: 'CONFIRMED', // Auto-confirm since it's from waitlist
    },
  });

  // Update waitlist entry
  await prisma.waitlistEntry.update({
    where: { id: waitlistId },
    data: {
      status: 'BOOKED',
      bookedAppointmentId: appointment.id,
    },
  });

  return appointment;
}