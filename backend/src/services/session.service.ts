import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export interface CreateSessionData {
  appointmentId: string;
  diagnosis: string;
  treatmentPlan?: string;
  notes?: string;
  duration?: number;
  painLevel?: number;
}

const sessionInclude = {
  appointment: {
    select: { id: true, dateTime: true, patient: { select: { id: true, name: true, phone: true } } },
  },
  therapist: { select: { id: true, name: true } },
} as const;

export async function createSession(data: CreateSessionData) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: data.appointmentId },
    include: { therapist: true },
  });
  if (!appointment) throw new HttpError(404, 'Appointment not found');
  if (appointment.status !== 'COMPLETED') {
    throw new HttpError(400, 'Session notes can only be added to completed appointments');
  }
  if (data.painLevel !== undefined && (data.painLevel < 0 || data.painLevel > 10)) {
    throw new HttpError(400, 'Pain level must be between 0 and 10');
  }
  return prisma.therapySession.create({
    data: {
      appointmentId: data.appointmentId,
      therapistId: appointment.therapistId,
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatmentPlan ?? null,
      notes: data.notes ?? null,
      duration: data.duration ?? appointment.duration,
      painLevel: data.painLevel ?? null,
    },
    include: sessionInclude,
  });
}

export async function listSessions(filters: { appointmentId?: string; therapistId?: string; page: number; limit: number }) {
  const where: Record<string, unknown> = {};
  if (filters.appointmentId) where.appointmentId = filters.appointmentId;
  if (filters.therapistId) where.therapistId = filters.therapistId;
  const [sessions, total] = await Promise.all([
    prisma.therapySession.findMany({
      where, include: sessionInclude, orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit, take: filters.limit,
    }),
    prisma.therapySession.count({ where }),
  ]);
  return { data: sessions, pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}

export async function getSessionById(id: string) {
  const session = await prisma.therapySession.findUnique({ where: { id }, include: sessionInclude });
  if (!session) throw new HttpError(404, 'Session not found');
  return session;
}

export async function updateSession(id: string, data: Partial<CreateSessionData>) {
  const session = await prisma.therapySession.findUnique({ where: { id } });
  if (!session) throw new HttpError(404, 'Session not found');
  if (data.painLevel !== undefined && (data.painLevel < 0 || data.painLevel > 10)) {
    throw new HttpError(400, 'Pain level must be between 0 and 10');
  }
  return prisma.therapySession.update({
    where: { id },
    data: {
      ...(data.diagnosis !== undefined && { diagnosis: data.diagnosis }),
      ...(data.treatmentPlan !== undefined && { treatmentPlan: data.treatmentPlan }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.painLevel !== undefined && { painLevel: data.painLevel }),
    },
    include: sessionInclude,
  });
}