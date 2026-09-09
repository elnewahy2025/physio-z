import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export async function listRooms() {
  return prisma.room.findMany({
    orderBy: { number: 'asc' },
    include: { _count: { select: { appointments: true } } },
  });
}

export async function getRoomAvailability(dateStr: string) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) throw new HttpError(400, 'Invalid date format. Use YYYY-MM-DD.');
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return prisma.room.findMany({
    orderBy: { number: 'asc' },
    include: {
      appointments: {
        where: { dateTime: { gte: startOfDay, lte: endOfDay }, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: {
          patient: { select: { id: true, name: true } },
          therapist: { select: { id: true, name: true } },
        },
        orderBy: { dateTime: 'asc' },
      },
    },
  });
}