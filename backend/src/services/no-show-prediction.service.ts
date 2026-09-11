// backend/src/services/no-show-prediction.service.ts
// I1: No-Show Prediction - Risk scoring based on patient history

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

interface NoShowRiskFactors {
  patientId: string;
  appointmentId: string;
  appointmentDate: Date;
  daysUntilAppointment: number;
  dayOfWeek: number;
  hour: number;
  patientNoShowHistory: number;
  patientCancellationHistory: number;
  patientAge: number;
  hasActivePackage: boolean;
  outstandingBalance: number;
  lastVisitDaysAgo: number | null;
}

interface NoShowPrediction {
  appointmentId: string;
  patientId: string;
  patientName: string;
  appointmentDate: Date;
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: NoShowRiskFactors;
  recommendations: string[];
}

/**
 * Predict no-show risk for a specific appointment
 */
export async function predictNoShowRisk(appointmentId: string): Promise<NoShowPrediction> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        include: {
          user: true,
          patientPackages: {
            where: { status: 'ACTIVE' },
          },
          invoices: {
            where: { status: 'UNPAID' },
          },
        },
      },
      therapist: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new HttpError(404, 'الموعد غير موجود');
  }

  // Calculate risk factors
  const now = new Date();
  const appointmentDate = new Date(appointment.dateTime);
  const daysUntilAppointment = Math.ceil(
    (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get patient appointment history
  const patientHistory = await getPatientHistory(appointment.patientId);
  
  // Get last visit
  const lastVisit = await prisma.appointment.findFirst({
    where: {
      patientId: appointment.patientId,
      status: 'COMPLETED',
      dateTime: {
        lt: now,
      },
    },
    orderBy: { dateTime: 'desc' },
  });

  const lastVisitDaysAgo = lastVisit
    ? Math.floor((now.getTime() - new Date(lastVisit.dateTime).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Get patient age
  const patientAge = appointment.patient.dateOfBirth
    ? calculateAge(new Date(appointment.patient.dateOfBirth))
    : 0;

  // Calculate outstanding balance
  const outstandingBalance = appointment.patient.invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0
  );

  const riskFactors: NoShowRiskFactors = {
    patientId: appointment.patientId,
    appointmentId: appointment.id,
    appointmentDate,
    daysUntilAppointment,
    dayOfWeek: appointmentDate.getDay(),
    hour: appointmentDate.getHours(),
    patientNoShowHistory: patientHistory.noShowCount,
    patientCancellationHistory: patientHistory.cancellationCount,
    patientAge,
    hasActivePackage: appointment.patient.patientPackages.length > 0,
    outstandingBalance,
    lastVisitDaysAgo,
  };

  // Calculate risk score
  const riskScore = calculateRiskScore(riskFactors);
  const riskLevel = getRiskLevel(riskScore);
  const recommendations = getRecommendations(riskFactors, riskScore);

  return {
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    patientName: appointment.patient.name,
    appointmentDate,
    riskScore,
    riskLevel,
    riskFactors,
    recommendations,
  };
}

/**
 * Get patient risk profile
 */
export async function getPatientRiskProfile(patientId: string) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      appointments: {
        orderBy: { dateTime: 'desc' },
        take: 50,
      },
      invoices: {
        where: { status: 'UNPAID' },
      },
    },
  });

  if (!patient) {
    throw new HttpError(404, 'المريض غير موجود');
  }

  const patientHistory = await getPatientHistory(patientId);
  const outstandingBalance = patient.invoices.reduce(
    (sum, invoice) => sum + Number(invoice.total),
    0
  );

  // Calculate overall risk score
  const overallRiskScore = calculateHistoricalRiskScore(
    patientHistory,
    outstandingBalance
  );

  return {
    patientId,
    patientName: patient.name,
    totalAppointments: patient.appointments.length,
    noShowCount: patientHistory.noShowCount,
    cancellationCount: patientHistory.cancellationCount,
    completionRate: calculateCompletionRate(patient.appointments),
    outstandingBalance,
    overallRiskScore,
    riskLevel: getRiskLevel(overallRiskScore),
    recommendations: getGeneralRecommendations(
      patientHistory,
      outstandingBalance
    ),
  };
}

/**
 * Get upcoming appointments risk (next 7 days)
 */
export async function getUpcomingAppointmentsRisk() {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: now,
        lte: nextWeek,
      },
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
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
    orderBy: { dateTime: 'asc' },
  });

  const riskAssessments: NoShowPrediction[] = [];

  for (const appointment of upcomingAppointments) {
    try {
      const riskAssessment = await predictNoShowRisk(appointment.id);
      riskAssessments.push(riskAssessment);
    } catch (error) {
      // Skip appointments with errors
      console.error(`Failed to assess appointment ${appointment.id}:`, error);
    }
  }

  // Group by risk level for summary
  const summary = {
    total: riskAssessments.length,
    low: riskAssessments.filter(r => r.riskLevel === 'LOW').length,
    medium: riskAssessments.filter(r => r.riskLevel === 'MEDIUM').length,
    high: riskAssessments.filter(r => r.riskLevel === 'HIGH').length,
    critical: riskAssessments.filter(r => r.riskLevel === 'CRITICAL').length,
  };

  return {
    summary,
    appointments: riskAssessments.sort((a, b) => b.riskScore - a.riskScore),
  };
}

/**
 * Get no-show statistics for the center
 */
export async function getNoShowStatistics(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: {
        gte: startDate,
      },
    },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const totalAppointments = appointments.length;
  const noShows = appointments.filter(a => a.status === 'NO_SHOW');
  const cancellations = appointments.filter(a => a.status === 'CANCELLED');
  const completions = appointments.filter(a => a.status === 'COMPLETED');

  // Group no-shows by day of week
  const noShowsByDayOfWeek = new Array(7).fill(0);
  noShows.forEach(appointment => {
    const dayOfWeek = new Date(appointment.dateTime).getDay();
    noShowsByDayOfWeek[dayOfWeek]++;
  });

  // Group no-shows by hour
  const noShowsByHour: Record<number, number> = {};
  noShows.forEach(appointment => {
    const hour = new Date(appointment.dateTime).getHours();
    noShowsByHour[hour] = (noShowsByHour[hour] || 0) + 1;
  });

  // Find repeat no-show patients
  const patientNoShowCounts: Record<string, number> = {};
  noShows.forEach(appointment => {
    patientNoShowCounts[appointment.patientId] = 
      (patientNoShowCounts[appointment.patientId] || 0) + 1;
  });

  const repeatNoShowPatients = Object.entries(patientNoShowCounts)
    .filter(([_, count]) => count >= 2)
    .map(([patientId, count]) => ({
      patientId,
      count,
      patientName: appointments.find(a => a.patientId === patientId)?.patient.name || 'Unknown',
    }));

  return {
    period: `${days} days`,
    totalAppointments,
    noShowCount: noShows.length,
    cancellationCount: cancellations.length,
    completionCount: completions.length,
    noShowRate: totalAppointments > 0 ? (noShows.length / totalAppointments) * 100 : 0,
    cancellationRate: totalAppointments > 0 ? (cancellations.length / totalAppointments) * 100 : 0,
    noShowsByDayOfWeek,
    noShowsByHour,
    repeatNoShowPatients,
  };
}

/**
 * Private helper functions
 */

async function getPatientHistory(patientId: string) {
  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    select: { status: true },
  });

  const noShowCount = appointments.filter(a => a.status === 'NO_SHOW').length;
  const cancellationCount = appointments.filter(a => a.status === 'CANCELLED').length;
  const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

  return {
    totalAppointments: appointments.length,
    noShowCount,
    cancellationCount,
    completedCount,
    noShowRate: appointments.length > 0 ? noShowCount / appointments.length : 0,
    cancellationRate: appointments.length > 0 ? cancellationCount / appointments.length : 0,
  };
}

function calculateRiskScore(factors: NoShowRiskFactors): number {
  let score = 0;

  // Historical factors (40% weight - max 40 points)
  score += factors.patientNoShowHistory * 8; // 8 points per no-show (max ~32)
  score += factors.patientCancellationHistory * 3; // 3 points per cancellation (max ~12)

  // Behavioral factors (30% weight - max 30 points)
  if (factors.daysUntilAppointment <= 1) score += 15; // Last-minute bookings
  if (factors.dayOfWeek === 5 || factors.dayOfWeek === 6) score += 10; // Weekend appointments (Friday/Saturday in Egypt)
  if (factors.hour < 9 || factors.hour > 17) score += 5; // Early/late appointments

  // Demographic factors (15% weight - max 15 points)
  if (factors.patientAge < 25 || factors.patientAge > 65) score += 8;

  // Engagement factors (15% weight - max 15 points)
  if (factors.lastVisitDaysAgo !== null) {
    if (factors.lastVisitDaysAgo > 30) score += 7; // Haven't visited in over a month
    else if (factors.lastVisitDaysAgo > 14) score += 4;
  } else {
    score += 5; // Never completed a visit
  }

  if (factors.outstandingBalance > 0) score += 5;
  if (!factors.hasActivePackage) score += 3;

  // Normalize to 0-100 scale
  return Math.min(100, Math.round(score));
}

function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

function getRecommendations(factors: NoShowRiskFactors, score: number): string[] {
  const recommendations: string[] = [];

  if (score >= 75) {
    recommendations.push('اتصل بالمريض لتأكيد الموعد');
    recommendations.push('أرسل تذكير عبر واتساب');
  } else if (score >= 50) {
    recommendations.push('أرسل تذكير بالبريد الإلكتروني');
    recommendations.push('تأكيد الموعد عبر الرسائل النصية');
  }

  if (factors.patientNoShowHistory > 2) {
    recommendations.push('اطلب دفعة مقدمة لتأكيد الموعد');
    recommendations.push('ناقش سياسة المواعيد الفائتة مع المريض');
  }

  if (factors.outstandingBalance > 0) {
    recommendations.push('تذكير بالمبالغ المستحقة');
  }

  if (factors.daysUntilAppointment <= 1) {
    recommendations.push('تأكيد الموعد عبر الهاتف اليوم');
  }

  if (factors.lastVisitDaysAgo !== null && factors.lastVisitDaysAgo > 60) {
    recommendations.push('تحقق من استمرارية العلاج');
  }

  return recommendations;
}

function getGeneralRecommendations(history: any, balance: number): string[] {
  const recommendations: string[] = [];

  if (history.noShowRate > 0.3) {
    recommendations.push('مريض لديه معدل عدم حضور مرتفع');
    recommendations.push('يفضل طلب دفعة مقدمة');
  }

  if (history.cancellationRate > 0.4) {
    recommendations.push('مرضى يلغون المواعيد بشكل متكرر');
  }

  if (balance > 1000) {
    recommendations.push('مبالغ مستحقة مرتفعة');
  }

  return recommendations;
}

function calculateHistoricalRiskScore(history: any, balance: number): number {
  let score = 0;
  score += history.noShowCount * 15;
  score += history.cancellationCount * 10;
  score += Math.min(balance / 100, 20);
  return Math.min(100, score);
}

function calculateCompletionRate(appointments: any[]): number {
  if (appointments.length === 0) return 0;
  const completed = appointments.filter(a => a.status === 'COMPLETED').length;
  return (completed / appointments.length) * 100;
}

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
