import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class TreatmentEffectivenessService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async getTreatmentEffectiveness(filters?: {
    diagnosis?: string;
    therapistId?: string;
    dateFrom?: Date;
    dateTo?: Date;
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
    const sessions = await this.prisma.therapySession.findMany({
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
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by patient and diagnosis
    const patientDiagnosisMap = new Map<string, {
      diagnosis: string;
      sessions: any[];
    }>();

    for (const session of sessions) {
      const key = `${session.appointment.patientId}_${session.diagnosis}`;
      
      if (!patientDiagnosisMap.has(key)) {
        patientDiagnosisMap.set(key, {
          diagnosis: session.diagnosis,
          sessions: [],
        });
      }
      
      patientDiagnosisMap.get(key).sessions.push({
        id: session.id,
        painLevel: session.painLevel,
        createdAt: session.createdAt,
        appointmentDate: session.appointment.dateTime,
        patientAge: this.calculateAge(
          session.appointment.patient.dateOfBirth,
        ),
      });
    }

    // Calculate effectiveness metrics
    const effectivenessResults = [];
    
    for (const [key, data] of patientDiagnosisMap) {
      if (data.sessions.length < 2) continue;

      const firstSession = data.sessions[0];
      const lastSession = data.sessions[data.sessions.length - 1];
      
      const painReduction = firstSession.painLevel - lastSession.painLevel;
      const sessionsCount = data.sessions.length;
      
      // Calculate success metrics
      const isSuccessful = painReduction >= 2; // Consider success if pain reduced by 2+ points
      
      effectivenessResults.push({
        patientId: key.split('_')[0],
        diagnosis: data.diagnosis,
        initialPainLevel: firstSession.painLevel,
        finalPainLevel: lastSession.painLevel,
        painReduction,
        sessionsCount,
        durationDays: Math.floor(
          (lastSession.appointmentDate.getTime() - firstSession.appointmentDate.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        isSuccessful,
        patientAge: firstSession.patientAge,
      });
    }

    // Aggregate by diagnosis
    const diagnosisStats = new Map<string, {
      diagnosis: string;
      totalPatients: number;
      successfulPatients: number;
      totalSessions: number;
      totalPainReduction: number;
      averageSessionsToSuccess: number;
      successRate: number;
      averagePainReduction: number;
      averageDurationDays: number;
    }>();

    for (const result of effectivenessResults) {
      if (!diagnosisStats.has(result.diagnosis)) {
        diagnosisStats.set(result.diagnosis, {
          diagnosis: result.diagnosis,
          totalPatients: 0,
          successfulPatients: 0,
          totalSessions: 0,
          totalPainReduction: 0,
          averageSessionsToSuccess: 0,
          successRate: 0,
          averagePainReduction: 0,
          averageDurationDays: 0,
        });
      }

      const stats = diagnosisStats.get(result.diagnosis);
      stats.totalPatients++;
      stats.totalSessions += result.sessionsCount;
      stats.totalPainReduction += result.painReduction;

      if (result.isSuccessful) {
        stats.successfulPatients++;
        stats.averageSessionsToSuccess += result.sessionsCount;
      }
    }

    // Calculate final statistics
    const results = Array.from(diagnosisStats.values()).map((stats) => {
      stats.successRate = (stats.successfulPatients / stats.totalPatients) * 100;
      stats.averagePainReduction = stats.totalPainReduction / stats.totalPatients;
      stats.averageSessionsToSuccess = 
        stats.successfulPatients > 0
          ? stats.averageSessionsToSuccess / stats.successfulPatients
          : 0;
      
      return stats;
    });

    // Get overall statistics
    const overallStats = {
      totalPatients: results.reduce((sum, r) => sum + r.totalPatients, 0),
      totalDiagnoses: results.length,
      averageSuccessRate:
        results.length > 0
          ? results.reduce((sum, r) => sum + r.successRate, 0) / results.length
          : 0,
      averagePainReduction:
        results.length > 0
          ? results.reduce((sum, r) => sum + r.averagePainReduction, 0) / results.length
          : 0,
    };

    return {
      overall: overallStats,
      byDiagnosis: results,
      rawResults: effectivenessResults.slice(0, 100), // Limit for performance
    };
  }

  async getTherapistEffectiveness(therapistId: string) {
    const therapist = await this.prisma.user.findUnique({
      where: { id: therapistId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!therapist) {
      throw new BadRequestException('Therapist not found');
    }

    // Get all sessions for this therapist
    const sessions = await this.prisma.therapySession.findMany({
      where: {
        therapistId,
        appointment: {
          status: 'COMPLETED',
        },
      },
      include: {
        appointment: {
          include: {
            patient: true,
          },
        },
      },
    });

    // Group by patient
    const patientMap = new Map<string, {
      patientId: string;
      patientName: string;
      sessions: any[];
      initialPainLevel: number;
      finalPainLevel: number;
      painReduction: number;
      isSuccessful: boolean;
    }>();

    for (const session of sessions) {
      if (!patientMap.has(session.appointment.patientId)) {
        patientMap.set(session.appointment.patientId, {
          patientId: session.appointment.patientId,
          patientName: session.appointment.patient.name,
          sessions: [],
          initialPainLevel: session.painLevel,
          finalPainLevel: session.painLevel,
          painReduction: 0,
          isSuccessful: false,
        });
      }

      const patientData = patientMap.get(session.appointment.patientId);
      patientData.sessions.push(session);
      patientData.finalPainLevel = session.painLevel;
      patientData.painReduction = patientData.initialPainLevel - patientData.finalPainLevel;
      patientData.isSuccessful = patientData.painReduction >= 2;
    }

    const patientResults = Array.from(patientMap.values());
    const successfulPatients = patientResults.filter((p) => p.isSuccessful).length;

    return {
      therapist: {
        id: therapist.id,
        name: therapist.name,
      },
      totalPatients: patientResults.length,
      successfulPatients,
      successRate: (successfulPatients / patientResults.length) * 100,
      averagePainReduction:
        patientResults.length > 0
          ? patientResults.reduce((sum, p) => sum + p.painReduction, 0) / patientResults.length
          : 0,
      patientDetails: patientResults,
    };
  }

  private calculateAge(dateOfBirth: Date): number {
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
}
