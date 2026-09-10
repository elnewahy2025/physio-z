// backend/src/services/rating.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export interface CreateRatingData {
  appointmentId: string;
  rating: number;
  comment?: string;
}

export async function createRating(patientUserId: string, data: CreateRatingData) {
  // 1. Validate rating value
  if (data.rating < 1 || data.rating > 5) {
    throw new HttpError(400, 'Rating must be between 1 and 5');
  }

  // 2. Find the appointment and verify it belongs to this patient
  const appointment = await prisma.appointment.findUnique({
    where: { id: data.appointmentId },
    include: { patient: true },
  });

  if (!appointment) throw new HttpError(404, 'Appointment not found');

  // Verify the patient owns this appointment
  const patient = await prisma.patient.findFirst({
    where: { userId: patientUserId },
  });
  if (!patient || appointment.patientId !== patient.id) {
    throw new HttpError(403, 'You can only rate your own appointments');
  }

  // 3. Verify the appointment is COMPLETED
  if (appointment.status !== 'COMPLETED') {
    throw new HttpError(400, 'You can only rate completed appointments');
  }

  // 4. Check if already rated
  const existing = await prisma.rating.findUnique({
    where: { appointmentId: data.appointmentId },
  });
  if (existing) {
    throw new HttpError(409, 'You have already rated this appointment');
  }

  // 5. Create the rating
  return prisma.rating.create({
    data: {
      appointmentId: data.appointmentId,
      patientId: appointment.patientId,
      therapistId: appointment.therapistId,
      rating: data.rating,
      comment: data.comment ?? null,
    },
    include: {
      appointment: {
        select: { id: true, dateTime: true },
      },
      therapist: { select: { id: true, name: true } },
    },
  });
}

export async function getTherapistRating(therapistId: string) {
  const result = await prisma.rating.aggregate({
    where: { therapistId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    average: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : null,
    count: result._count.rating,
  };
}

export async function getTherapistRatings(therapistIds: string[]) {
  const ratings = await prisma.rating.groupBy({
    by: ['therapistId'],
    where: { therapistId: { in: therapistIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const map = new Map<string, { average: number | null; count: number }>();
  for (const r of ratings) {
    map.set(r.therapistId, {
      average: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null,
      count: r._count.rating,
    });
  }
  return map;
}

export async function getPatientRatings(patientId: string) {
  return prisma.rating.findMany({
    where: { patientId },
    include: {
      therapist: { select: { id: true, name: true } },
      appointment: { select: { id: true, dateTime: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}