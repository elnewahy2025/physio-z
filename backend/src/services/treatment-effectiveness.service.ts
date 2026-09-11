// backend/src/services/treatment-effectiveness.service.ts
// I3: Treatment Effectiveness - Which treatments work best per diagnosis

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

/**
 * Get treatment effectiveness analysis
 * Analyzes pain reduction by diagnosis and treatment plan
 */
export async function getTreatmentEffectiveness(filters?: {
  diagnosis?: string;
  therapistId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minSessions?: number;
}) {
  // Build where clause based on filters
  const whereClause: any = {
    appointment: {
      status: 'COMPLETED',
    },
  };

  if (filters?.diagnosis) {
    whereClause.diagnosis = {
      contains: filters.diagnosis,
      mode: 'insensitive',
    };
  }

  if (filters?.therapistId) {
    whereClause.therapistId = filters.therapistId;
  }

  if (filters?.dateFrom || filters?.dateTo) {
    whereClause.appointment = {
      ...whereClause.appointment,
      dateTime: {},
    };
    if (filters?.dateFrom) {
      whereClause.appointment.dateTime.gte = filters.dateFrom;
    }
    if (filters?.dateTo) {
      whereClause.appointment.dateTime.lte = filters.dateTo;
    }
  }

  // Get all completed therapy sessions with pain levels
  const sessions = await prisma.therapySession.findMany({
    where: whereClause,
    include: {
      appointment: {
        include: {
          patient: {
            select: {
              id: true,
              dateOfBirth: true,
            },
          },
          therapist: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Filter sessions with pain levels
  const sessionsWithPain = sessions.filter(s => s.painLevel !== null && s.painLevel !== undefined);

  // Group by patient and diagnosis
  const patientDiagnosisMap = new Map<string, {
    diagnosis: string;
    treatmentPlan: string | null;
    therapistId: string;
    therapistName: string;
    sessions: any[];
  }>();

  for (const session of sessionsWithPain) {
    const key = `${session.appointment.patientId}_${session.diagnosis}_${session.therapistId}`;
    
    if (!patientDiagnosisMap.has(key)) {
      patientDiagnosisMap.set(key, {
        diagnosis: session.diagnosis,
        treatmentPlan: session.treatmentPlan,
        therapistId: session.therapistId,
        therapistName: session.appointment.therapist.name,
        sessions: [],
      });
    }
    
    patientDiagnosisMap.get(key)!.sessions.push({
      id: session.id,
      painLevel: session.painLevel,
      createdAt: session.createdAt,
      appointmentDate: session.appointment.dateTime,
      patientAge: session.appointment.patient.dateOfBirth
        ? calculateAge(new Date(session.appointment.patient.dateOfBirth))
        : null,
    });
  }

  // Calculate effectiveness metrics
  const effectivenessResults = [];
  
  for (const [key, data] of patientDiagnosisMap) {
    if (data.sessions.length < 2) continue; // Need at least 2 sessions

    const firstSession = data.sessions[0];
    const lastSession = data.sessions[data.sessions.length - 1];
    
    const painReduction = firstSession.painLevel! - lastSession.painLevel!;
    const sessionsCount = data.sessions.length;
    
    // Calculate success (pain reduction >= 2 points is considered successful)
    const isSuccessful = painReduction >= 2;
    
    // Calculate duration in days
    const durationDays = Math.floor(
      (new Date(lastSession.appointmentDate).getTime() - 
       new Date(firstSession.appointmentDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    effectivenessResults.push({
      patientId: key.split('_')[0],
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatmentPlan,
      therapistId: data.therapistId,
      therapistName: data.therapistName,
      initialPainLevel: firstSession.painLevel,
      finalPainLevel: lastSession.painLevel,
      painReduction,
      sessionsCount,
      durationDays,
      isSuccessful,
      patientAge: firstSession.patientAge,
    });
  }

  // Filter by minimum sessions if specified
  let filteredResults = effectivenessResults;
  if (filters?.minSessions) {
    filteredResults = filteredResults.filter(r => r.sessionsCount >= filters.minSessions!);
  }

  // Aggregate by diagnosis
  const diagnosisStats = new Map<string, {
    diagnosis: string;
    treatmentPlan: string | null;
    totalPatients: number;
    successfulPatients: number;
    totalSessions: number;
    totalPainReduction: number;
    averageSessionsToSuccess: number;
    successRate: number;
    averagePainReduction: number;
    averageDurationDays: number;
    therapistBreakdown: Map<string, { count: number; successful: number }>;
  }>();

  for (const result of filteredResults) {
    const statKey = `${result.diagnosis}_${result.treatmentPlan || 'none'}`;
    
    if (!diagnosisStats.has(statKey)) {
      diagnosisStats.set(statKey, {
        diagnosis: result.diagnosis,
        treatmentPlan: result.treatmentPlan,
        totalPatients: 0,
        successfulPatients: 0,
        totalSessions: 0,
        totalPainReduction: 0,
        averageSessionsToSuccess: 0,
        successRate: 0,
        averagePainReduction: 0,
        averageDurationDays: 0,
        therapistBreakdown: new Map(),
      });
    }

    const stats = diagnosisStats.get(statKey)!;
    stats.totalPatients++;
    stats.totalSessions += result.sessionsCount;
    stats.totalPainReduction += result.painReduction;

    if (result.isSuccessful) {
      stats.successfulPatients++;
      stats.averageSessionsToSuccess += result.sessionsCount;
    }

    // Track therapist performance
    if (!stats.therapistBreakdown.has(result.therapistName)) {
      stats.therapistBreakdown.set(result.therapistName, { count: 0, successful: 0 });
    }
    const therapistStats = stats.therapistBreakdown.get(result.therapistName)!;
    therapistStats.count++;
    if (result.isSuccessful) {
      therapistStats.successful++;
    }
  }

  // Calculate final statistics
  const results = Array.from(diagnosisStats.values()).map((stats) => {
    stats.successRate = stats.totalPatients > 0
      ? (stats.successfulPatients / stats.totalPatients) * 100
      : 0;
    stats.averagePainReduction = stats.totalPatients > 0
      ? stats.totalPainReduction / stats.totalPatients
      : 0;
    stats.averageSessionsToSuccess = stats.successfulPatients > 0
      ? stats.averageSessionsToSuccess / stats.successfulPatients
      : 0;

    // Convert therapist breakdown to array
    const therapistBreakdown = Array.from(stats.therapistBreakdown.entries()).map(
      ([name, data]) => ({
        therapistName: name,
        totalPatients: data.count,
        successfulPatients: data.successful,
        successRate: data.count > 0 ? (data.successful / data.count) * 100 : 0,
      })
    );

    return {
      ...stats,
      therapistBreakdown,
    };
  });

  // Sort by success rate
  results.sort((a, b) => b.successRate - a.successRate);

  // Get overall statistics
  const overallStats = {
    totalPatients: results.reduce((sum, r) => sum + r.totalPatients, 0),
    totalDiagnoses: results.length,
    averageSuccessRate: results.length > 0
      ? results.reduce((sum, r) => sum + r.successRate, 0) / results.length
      : 0,
    averagePainReduction: results.length > 0
      ? results.reduce((sum, r) => sum + r.averagePainReduction, 0) / results.length
      : 0,
  };

  return {
    overall: overallStats,
    byDiagnosis: results,
    rawResults: filteredResults.slice(0, 100), // Limit for performance
  };
}

/**
 * Get therapist effectiveness
 */
export async function getTherapistEffectiveness(therapistId: string) {
  const therapist = await prisma.user.findUnique({
    where: { id: therapistId },
    select: {
      id: true,
      name: true,
    },
  });

  if (!therapist) {
    throw new HttpError(404, 'الطبيب غير موجود');
  }

  // Get all sessions for this therapist
  const sessions = await prisma.therapySession.findMany({
    where: {
      therapistId,
      appointment: {
        status: 'COMPLETED',
      },
      painLevel: {
        not: null,
      },
    },
    include: {
      appointment: {
        include: {
          patient: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by patient
  const patientMap = new Map<string, {
    patientId: string;
    patientName: string;
    diagnosis: string;
    sessions: any[];
    initialPainLevel: number;
    finalPainLevel: number;
    painReduction: number;
    isSuccessful: boolean;
  }>();

  for (const session of sessions) {
    const patientKey = `${session.appointment.patientId}_${session.diagnosis}`;
    
    if (!patientMap.has(patientKey)) {
      patientMap.set(patientKey, {
        patientId: session.appointment.patientId,
        patientName: session.appointment.patient.name,
        diagnosis: session.diagnosis,
        sessions: [],
        initialPainLevel: session.painLevel!,
        finalPainLevel: session.painLevel!,
        painReduction: 0,
        isSuccessful: false,
      });
    }

    const patientData = patientMap.get(patientKey)!;
    patientData.sessions.push(session);
    patientData.finalPainLevel = session.painLevel!;
    patientData.painReduction = patientData.initialPainLevel - patientData.finalPainLevel;
    patientData.isSuccessful = patientData.painReduction >= 2;
  }

  const patientResults = Array.from(patientMap.values());
  const successfulPatients = patientResults.filter(p => p.isSuccessful).length;

  // Calculate diagnosis-specific performance
  const diagnosisPerformance = new Map<string, { total: number; successful: number }>();
  
  for (const patient of patientResults) {
    if (!diagnosisPerformance.has(patient.diagnosis)) {
      diagnosisPerformance.set(patient.diagnosis, { total: 0, successful: 0 });
    }
    
    const perf = diagnosisPerformance.get(patient.diagnosis)!;
    perf.total++;
    if (patient.isSuccessful) {
      perf.successful++;
    }
  }

  const diagnosisBreakdown = Array.from(diagnosisPerformance.entries()).map(
    ([diagnosis, data]) => ({
      diagnosis,
      totalPatients: data.total,
      successfulPatients: data.successful,
      successRate: data.total > 0 ? (data.successful / data.total) * 100 : 0,
    })
  );

  return {
    therapist: {
      id: therapist.id,
      name: therapist.name,
    },
    totalPatients: patientResults.length,
    successfulPatients,
    successRate: patientResults.length > 0 ? (successfulPatients / patientResults.length) * 100 : 0,
    averagePainReduction: patientResults.length > 0
      ? patientResults.reduce((sum, p) => sum + p.painReduction, 0) / patientResults.length
      : 0,
    diagnosisBreakdown,
    patientDetails: patientResults,
  };
}

/**
 * Get treatment trends over time
 */
export async function getTreatmentTrends(months: number = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const sessions = await prisma.therapySession.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
      painLevel: {
        not: null,
      },
    },
    include: {
      appointment: {
        select: {
          dateTime: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by month and diagnosis
  const monthlyTrends = new Map<string, Map<string, { count: number; totalPainReduction: number; successful: number }>>();

  for (const session of sessions) {
    const monthKey = `${session.createdAt.getFullYear()}-${String(session.createdAt.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyTrends.has(monthKey)) {
      monthlyTrends.set(monthKey, new Map());
    }
    
    const monthData = monthlyTrends.get(monthKey)!;
    
    if (!monthData.has(session.diagnosis)) {
      monthData.set(session.diagnosis, { count: 0, totalPainReduction: 0, successful: 0 });
    }
    
    const diagnosisData = monthData.get(session.diagnosis)!;
    diagnosisData.count++;
    
    // Calculate pain reduction for this session (simplified)
    // In a real analysis, you'd compare with initial pain level
    if (session.painLevel !== null && session.painLevel < 5) {
      diagnosisData.successful++;
    }
  }

  // Convert to array format
  const trends = Array.from(monthlyTrends.entries()).map(([month, diagnoses]) => ({
    month,
    diagnoses: Array.from(diagnoses.entries()).map(([diagnosis, data]) => ({
      diagnosis,
      sessionCount: data.count,
      successRate: data.count > 0 ? (data.successful / data.count) * 100 : 0,
    })),
  }));

  return trends.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Private helper functions
 */

function calculateAge(dateOfBirth: Date): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
