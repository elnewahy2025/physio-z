// backend/src/services/survey.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export async function submitSurvey(data: {
  appointmentId: string;
  rating: number;
  feedback?: string;
}) {
  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    throw new HttpError(400, 'Rating must be between 1 and 5');
  }

  // Check appointment exists and is completed
  const appointment = await prisma.appointment.findUnique({
    where: { id: data.appointmentId },
    include: { patient: true },
  });
  if (!appointment) throw new HttpError(404, 'Appointment not found');
  if (appointment.status !== 'COMPLETED') {
    throw new HttpError(400, 'Can only rate completed appointments');
  }

  // Check if already surveyed
  const existing = await prisma.survey.findUnique({
    where: { appointmentId: data.appointmentId },
  });
  if (existing) {
    throw new HttpError(409, 'You have already submitted feedback for this appointment');
  }

  // Create survey
  const survey = await prisma.survey.create({
    data: {
      appointmentId: data.appointmentId,
      patientId: appointment.patientId,
      therapistId: appointment.therapistId,
      rating: data.rating,
      feedback: data.feedback ?? null,
    },
    include: {
      therapist: { select: { id: true, name: true } },
    },
  });

  // Notify therapist
  await prisma.notification.create({
    data: {
      userId: appointment.therapistId,
      type: 'SURVEY_RECEIVED',
      title: 'New Patient Feedback',
      message: `A patient rated your session ${data.rating}/5${data.feedback ? `: "${data.feedback}"` : ''}`,
      link: '/sessions',
    },
  });

  return survey;
}

export async function getSurveyResults(therapistId?: string) {
  const where: Record<string, unknown> = {};
  if (therapistId) where.therapistId = therapistId;

  const [surveys, aggregate] = await Promise.all([
    prisma.survey.findMany({
      where,
      include: {
        therapist: { select: { id: true, name: true } },
        appointment: { select: { dateTime: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    }),
    prisma.survey.aggregate({
      where,
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const totalCount = aggregate._count.rating;

  // Rating distribution
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const s of surveys) {
    distribution[s.rating]++;
  }

  // Group by therapist
  const byTherapist = await prisma.survey.groupBy({
    by: ['therapistId'],
    where,
    _avg: { rating: true },
    _count: { rating: true },
  });

  const therapistNames = await prisma.user.findMany({
    where: { role: 'THERAPIST' },
    select: { id: true, name: true },
  });
  const nameMap = new Map(therapistNames.map((t) => [t.id, t.name]));

  return {
    summary: {
      averageRating: aggregate._avg.rating
        ? Math.round(aggregate._avg.rating * 10) / 10
        : null,
      totalResponses: totalCount,
    },
    distribution: Object.entries(distribution).map(([stars, count]) => ({
      stars: Number(stars),
      count,
      percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    })),
    byTherapist: byTherapist.map((t) => ({
      therapistId: t.therapistId,
      therapistName: nameMap.get(t.therapistId) || 'Unknown',
      averageRating: t._avg.rating ? Math.round(t._avg.rating * 10) / 10 : null,
      responseCount: t._count.rating,
    })),
    recentSurveys: surveys.map((s) => ({
      id: s.id,
      therapistName: s.therapist.name,
      rating: s.rating,
      feedback: s.feedback,
      appointmentDate: s.appointment.dateTime,
      submittedAt: s.submittedAt,
    })),
  };
}

export async function checkPatientSurveyEligibility(patientUserId: string) {
  const patient = await prisma.patient.findFirst({
    where: { userId: patientUserId },
  });
  if (!patient) return [];

  // Find completed appointments without surveys
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId: patient.id,
      status: 'COMPLETED',
      survey: null,
    },
    include: {
      therapist: { select: { id: true, name: true } },
    },
    orderBy: { dateTime: 'desc' },
    take: 10,
  });

  return appointments;
}