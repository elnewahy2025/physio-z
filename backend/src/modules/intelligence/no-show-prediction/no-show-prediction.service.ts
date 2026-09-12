import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';

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
  distanceFromClinic: number;
  hasActivePackage: boolean;
  outstandingBalance: number;
}

@Injectable()
export class NoShowPredictionService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async predictNoShowRisk(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
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
      },
    });

    if (!appointment) {
      throw new BadRequestException('Appointment not found');
    }

    // Calculate risk factors
    const now = new Date();
    const appointmentDate = new Date(appointment.dateTime);
    const daysUntilAppointment = Math.ceil(
      (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Get patient history
    const patientHistory = await this.getPatientHistory(appointment.patientId);

    // Get patient age
    const patientAge = this.calculateAge(appointment.patient.dateOfBirth);

    // Calculate distance from clinic (if address is available)
    const distanceFromClinic = this.estimateDistanceFromClinic(
      appointment.patient.address,
    );

    // Check if patient has active package
    const hasActivePackage = appointment.patient.patientPackages.length > 0;

    // Calculate outstanding balance
    const outstandingBalance = appointment.patient.invoices.reduce(
      (sum: number, invoice: any) => sum + Number(invoice.total),
      0,
    );

    const riskFactors: NoShowRiskFactors = {
      patientId: appointment.patientId,
      appointmentId: appointment.id,
      appointmentDate: appointmentDate,
      daysUntilAppointment,
      dayOfWeek: appointmentDate.getDay(),
      hour: appointmentDate.getHours(),
      patientNoShowHistory: patientHistory.noShowCount,
      patientCancellationHistory: patientHistory.cancellationCount,
      patientAge,
      distanceFromClinic,
      hasActivePackage,
      outstandingBalance,
    };

    // Calculate risk score using weighted factors
    const riskScore = this.calculateRiskScore(riskFactors);
    const riskLevel = this.getRiskLevel(riskScore);

    return {
      appointmentId,
      patientId: appointment.patientId,
      patientName: appointment.patient.name,
      patientPhone: appointment.patient.phone,
      appointmentDate: appointmentDate,
      riskScore,
      riskLevel,
      riskFactors,
      recommendations: this.getRecommendations(riskFactors, riskScore),
    };
  }

  async getPatientRiskProfile(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
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
      throw new BadRequestException('Patient not found');
    }

    const patientHistory = await this.getPatientHistory(patientId);
    const outstandingBalance = patient.invoices.reduce(
      (sum: number, invoice: any) => sum + Number(invoice.total),
      0,
    );

    // Calculate overall risk score based on historical data
    const overallRiskScore = this.calculateHistoricalRiskScore(
      patientHistory,
      outstandingBalance,
    );

    return {
      patientId,
      patientName: patient.name,
      totalAppointments: patient.appointments.length,
      noShowCount: patientHistory.noShowCount,
      cancellationCount: patientHistory.cancellationCount,
      completionRate: this.calculateCompletionRate(patient.appointments),
      outstandingBalance,
      overallRiskScore,
      riskLevel: this.getRiskLevel(overallRiskScore),
      recommendations: this.getGeneralRecommendations(
        patientHistory,
        outstandingBalance,
      ),
    };
  }

  async getUpcomingAppointmentsRisk() {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingAppointments = await this.prisma.appointment.findMany({
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
      },
      orderBy: { dateTime: 'asc' },
    });

    const riskAssessments = [];

    for (const appointment of upcomingAppointments) {
      const riskAssessment = await this.predictNoShowRisk(appointment.id);
      riskAssessments.push(riskAssessment);
    }

    return {
      totalAppointments: upcomingAppointments.length,
      highRiskAppointments: riskAssessments.filter(
        (r) => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL',
      ).length,
      riskAssessments,
    };
  }

  private async getPatientHistory(patientId: string) {
    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      select: { status: true },
    });

    const noShowCount = appointments.filter((a: any) => a.status === 'NO_SHOW').length;
    const cancellationCount = appointments.filter((a: any) => a.status === 'CANCELLED').length;
    const completedCount = appointments.filter((a: any) => a.status === 'COMPLETED').length;

    return {
      totalAppointments: appointments.length,
      noShowCount,
      cancellationCount,
      completedCount,
      noShowRate: appointments.length > 0 ? noShowCount / appointments.length : 0,
      cancellationRate: appointments.length > 0 ? cancellationCount / appointments.length : 0,
    };
  }

  private calculateRiskScore(factors: NoShowRiskFactors): number {
    let score = 0;

    // Historical factors (40% weight)
    score += factors.patientNoShowHistory * 10; // Up to 30 points
    score += factors.patientCancellationHistory * 5; // Up to 10 points

    // Behavioral factors (30% weight)
    if (factors.daysUntilAppointment <= 1) score += 15; // Last-minute bookings
    if (factors.dayOfWeek === 0 || factors.dayOfWeek === 6) score += 10; // Weekend appointments
    if (factors.hour < 9 || factors.hour > 17) score += 5; // Early/late appointments

    // Demographic factors (20% weight)
    if (factors.patientAge < 25 || factors.patientAge > 65) score += 10;
    if (factors.distanceFromClinic > 20) score += 10; // Assuming distance in km

    // Payment factors (10% weight)
    if (factors.outstandingBalance > 0) score += 5;
    if (!factors.hasActivePackage) score += 5;

    // Normalize to 0-100 scale
    return Math.min(100, score);
  }

  private getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score < 25) return 'LOW';
    if (score < 50) return 'MEDIUM';
    if (score < 75) return 'HIGH';
    return 'CRITICAL';
  }

  private getRecommendations(factors: NoShowRiskFactors, score: number): string[] {
    const recommendations = [];

    if (score >= 75) {
      recommendations.push('اتصل بالمريض لتأكيد الموعد');
      recommendations.push('أرسل تذكير عبر واتساب');
    } else if (score >= 50) {
      recommendations.push('أرسل تذكير بالبريد الإلكتروني');
      recommendations.push('تأكيد الموعد عبر الرسائل النصية');
    }

    if (factors.patientNoShowHistory > 2) {
      recommendations.push('اطلب دفعة مقدمة لتأكيد الموعد');
    }

    if (factors.outstandingBalance > 0) {
      recommendations.push('تذكير بالمبالغ المستحقة');
    }

    if (factors.daysUntilAppointment <= 1) {
      recommendations.push('تأكيد الموعد عبر الهاتف');
    }

    return recommendations;
  }

  private getGeneralRecommendations(history: any, balance: number): string[] {
    const recommendations = [];

    if (history.noShowRate > 0.3) {
      recommendations.push('مرضى لديهم معدل عدم حضور مرتفع');
    }

    if (history.cancellationRate > 0.4) {
      recommendations.push('مرضى يلغون المواعيد بشكل متكرر');
    }

    if (balance > 1000) {
      recommendations.push('مبالغ مستحقة مرتفعة');
    }

    return recommendations;
  }

  private calculateHistoricalRiskScore(history: any, balance: number): number {
    let score = 0;
    score += history.noShowCount * 15;
    score += history.cancellationCount * 10;
    score += Math.min(balance / 100, 20); // Up to 20 points for balance
    return Math.min(100, score);
  }

  private calculateCompletionRate(appointments: any[]): number {
    if (appointments.length === 0) return 0;
    const completed = appointments.filter((a: any) => a.status === 'COMPLETED').length;
    return (completed / appointments.length) * 100;
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

  private estimateDistanceFromClinic(address: string | null): number {
    // This is a placeholder for distance calculation
    // In a real implementation, this would use geolocation
    if (!address) return 10; // Default distance
    
    // Simple heuristic based on address length
    // In production, use Google Maps API or similar
    return Math.min(address.length / 10, 50);
  }
}
