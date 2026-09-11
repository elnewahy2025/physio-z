// backend/src/services/pain-map.service.ts
// P4: Body Diagram Pain Mapping

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

const VALID_BODY_VIEWS = ['front', 'back', 'left', 'right'];
const VALID_PAIN_TYPES = [
  'sharp',
  'dull',
  'burning',
  'throbbing',
  'stabbing',
  'numbness',
  'tingling',
];

/**
 * Add a pain marker to the body diagram
 */
export async function addPainMarker(
  patientId: string,
  painData: {
    bodyView: string;
    xCoordinate: number;
    yCoordinate: number;
    painIntensity: number;
    painType: string;
    painDescription?: string;
    bodyRegion?: string;
    appointmentId?: string;
  },
  userId: string
) {
  // Validate patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new HttpError(404, 'المريض غير موجود');
  }

  // Validate coordinates
  if (painData.xCoordinate < 0 || painData.xCoordinate > 100) {
    throw new HttpError(400, 'إحداثيات X يجب أن تكون بين 0 و 100');
  }
  if (painData.yCoordinate < 0 || painData.yCoordinate > 100) {
    throw new HttpError(400, 'إحداثيات Y يجب أن تكون بين 0 و 100');
  }

  // Validate pain intensity
  if (painData.painIntensity < 0 || painData.painIntensity > 10) {
    throw new HttpError(400, 'شدة الألم يجب أن تكون بين 0 و 10');
  }

  // Validate body view
  if (!VALID_BODY_VIEWS.includes(painData.bodyView)) {
    throw new HttpError(400, `عرض غير صحيح. المتاح: ${VALID_BODY_VIEWS.join(', ')}`);
  }

  // Validate pain type
  if (!VALID_PAIN_TYPES.includes(painData.painType)) {
    throw new HttpError(400, `نوع ألم غير صحيح. المتاح: ${VALID_PAIN_TYPES.join(', ')}`);
  }

  // Save pain marker
  const painMarker = await prisma.painMap.create({
    data: {
      patientId,
      ...painData,
    },
  });

  return painMarker;
}

/**
 * Get patient's pain history
 */
export async function getPatientPainHistory(
  patientId: string,
  userId: string,
  userRole: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  // Authorization check
  if (userRole === 'PATIENT') {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId },
    });
    if (!patient) {
      throw new HttpError(403, 'يمكنك فقط الوصول إلى تاريخ الألم الخاص بك');
    }
  }

  const where: any = { patientId };
  
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  return await prisma.painMap.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get pain map for specific appointment
 */
export async function getAppointmentPainMap(appointmentId: string) {
  return await prisma.painMap.findMany({
    where: { appointmentId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete a pain marker
 */
export async function deletePainMarker(markerId: string, userId: string) {
  const marker = await prisma.painMap.findUnique({
    where: { id: markerId },
  });

  if (!marker) {
    throw new HttpError(404, 'علامة الألم غير موجودة');
  }

  await prisma.painMap.delete({
    where: { id: markerId },
  });

  return { success: true };
}

/**
 * Get pain statistics for a patient
 */
export async function getPainStatistics(
  patientId: string,
  dateFrom?: Date,
  dateTo?: Date
) {
  const where: any = { patientId };
  
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = dateFrom;
    if (dateTo) where.createdAt.lte = dateTo;
  }

  const painMarkers = await prisma.painMap.findMany({
    where,
    select: {
      painIntensity: true,
      painType: true,
      bodyView: true,
      createdAt: true,
    },
  });

  // Calculate statistics
  const totalMarkers = painMarkers.length;
  const averageIntensity =
    totalMarkers > 0
      ? painMarkers.reduce((sum, marker) => sum + marker.painIntensity, 0) / totalMarkers
      : 0;

  const painTypeDistribution = painMarkers.reduce((acc, marker) => {
    acc[marker.painType] = (acc[marker.painType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const bodyViewDistribution = painMarkers.reduce((acc, marker) => {
    acc[marker.bodyView] = (acc[marker.bodyView] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalMarkers,
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    painTypeDistribution,
    bodyViewDistribution,
  };
}

/**
 * Get pain trend over time
 */
export async function getPainTrend(patientId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const markers = await prisma.painMap.findMany({
    where: {
      patientId,
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      painIntensity: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const trendByDate = new Map<string, { total: number; count: number }>();
  
  for (const marker of markers) {
    const dateKey = marker.createdAt.toISOString().split('T')[0];
    
    if (!trendByDate.has(dateKey)) {
      trendByDate.set(dateKey, { total: 0, count: 0 });
    }
    
    const trend = trendByDate.get(dateKey)!;
    trend.total += marker.painIntensity;
    trend.count++;
  }

  // Calculate daily averages
  const trend = Array.from(trendByDate.entries()).map(([date, data]) => ({
    date: new Date(date),
    averageIntensity: Math.round((data.total / data.count) * 10) / 10,
    count: data.count,
  }));

  return trend;
}
