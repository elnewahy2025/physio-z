// backend/src/services/schedule.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function listBlockedSlots(userId?: string) {
  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  return prisma.blockedSlot.findMany({
    where,
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

export async function createBlockedSlot(data: {
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason?: string;
  isRecurring?: boolean;
  specificDate?: Date;
}) {
  // Validate
  if (data.dayOfWeek < 0 || data.dayOfWeek > 6) {
    throw new HttpError(400, 'dayOfWeek must be 0-6 (Sunday=0)');
  }
  if (data.startTime >= data.endTime) {
    throw new HttpError(400, 'startTime must be before endTime');
  }

  // Check for overlap with existing blocked slots
  const existing = await prisma.blockedSlot.findMany({
    where: {
      userId: data.userId,
      dayOfWeek: data.dayOfWeek,
    },
  });

  for (const slot of existing) {
    if (data.startTime < slot.endTime && data.endTime > slot.startTime) {
      throw new HttpError(409, `Overlaps with existing block: ${slot.startTime}-${slot.endTime}`);
    }
  }

  return prisma.blockedSlot.create({
    data: {
      userId: data.userId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason ?? null,
      isRecurring: data.isRecurring ?? true,
      specificDate: data.specificDate ?? null,
    },
    include: { user: { select: { id: true, name: true } } },
  });
}

export async function deleteBlockedSlot(id: string) {
  const slot = await prisma.blockedSlot.findUnique({ where: { id } });
  if (!slot) throw new HttpError(404, 'Blocked slot not found');
  await prisma.blockedSlot.delete({ where: { id } });
  return { success: true };
}

// ─── Check if a time is blocked for a therapist ───
export async function isTimeBlocked(
  userId: string,
  dateTime: Date,
): Promise<boolean> {
  const dayOfWeek = dateTime.getDay();
  const timeStr = `${String(dateTime.getHours()).padStart(2, '0')}:${String(dateTime.getMinutes()).padStart(2, '0')}`;
  const dateStr = dateTime.toISOString().split('T')[0];

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      userId,
      OR: [
        { isRecurring: true, dayOfWeek },
        { isRecurring: false, specificDate: new Date(dateStr) },
      ],
    },
  });

  return blockedSlots.some(
    (slot) => timeStr >= slot.startTime && timeStr < slot.endTime,
  );
}

// ─── Get available time slots for a therapist on a date ───
export async function getAvailableSlots(userId: string, date: Date) {
  const dayOfWeek = date.getDay();

  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      userId,
      OR: [
        { isRecurring: true, dayOfWeek },
        { isRecurring: false, specificDate: date },
      ],
    },
  });

  // Get existing appointments
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointments = await prisma.appointment.findMany({
    where: {
      therapistId: userId,
      dateTime: { gte: startOfDay, lte: endOfDay },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { dateTime: true, duration: true },
  });

  // Generate all possible slots (9 AM - 5 PM, 45 min)
  const slots: Array<{ time: string; available: boolean; reason?: string }> = [];
  const current = new Date(date);
  current.setHours(9, 0, 0, 0);
  const end = new Date(date);
  end.setHours(17, 0, 0, 0);

  while (current < end) {
    const timeStr = `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;

    // Check if blocked
    const isBlocked = blockedSlots.some(
      (slot) => timeStr >= slot.startTime && timeStr < slot.endTime,
    );

    // Check if has appointment
    const hasAppointment = appointments.some((appt) => {
      const apptStart = new Date(appt.dateTime);
      const apptEnd = new Date(apptStart.getTime() + appt.duration * 60000);
      const slotEnd = new Date(current.getTime() + 45 * 60000);
      return apptStart < slotEnd && apptEnd > current;
    });

    // Check if past
    const isPast = current < new Date();

    slots.push({
      time: timeStr,
      available: !isBlocked && !hasAppointment && !isPast,
      reason: isBlocked ? 'Blocked' : hasAppointment ? 'Booked' : isPast ? 'Past' : undefined,
    });

    current.setMinutes(current.getMinutes() + 45);
  }

  return slots;
}