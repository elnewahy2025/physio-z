import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrescriptionService {
  constructor(private prisma: PrismaService) {}

  async createPrescription(data: {
    patientId: string;
    therapistId: string;
    appointmentId?: string;
    title: string;
    description?: string;
    instructions?: string;
    startDate?: Date;
    endDate?: Date;
    frequency?: string;
    duration?: string;
    exercises: Array<{
      exerciseId: string;
      sets?: number;
      reps?: number;
      holdTime?: number;
      restTime?: number;
      frequency?: string;
      notes?: string;
      dayOfWeek?: number[];
    }>;
    createdById: string;
  }) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate therapist exists
    const therapist = await this.prisma.user.findUnique({
      where: { id: data.therapistId },
    });

    if (!therapist) {
      throw new NotFoundException('Therapist not found');
    }

    // Validate exercises exist
    const exerciseIds = data.exercises.map((e) => e.exerciseId);
    const exercises = await this.prisma.exercise.findMany({
      where: {
        id: { in: exerciseIds },
        isActive: true,
      },
    });

    if (exercises.length !== exerciseIds.length) {
      throw new BadRequestException('One or more exercises not found or inactive');
    }

    // Create prescription with assignments
    const prescription = await this.prisma.exercisePrescription.create({
      data: {
        patientId: data.patientId,
        therapistId: data.therapistId,
        appointmentId: data.appointmentId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        startDate: data.startDate || new Date(),
        endDate: data.endDate,
        frequency: data.frequency,
        duration: data.duration,
        createdById: data.createdById,
        assignments: {
          create: data.exercises.map((exercise) => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            holdTime: exercise.holdTime,
            restTime: exercise.restTime,
            frequency: exercise.frequency,
            notes: exercise.notes,
            dayOfWeek: exercise.dayOfWeek || [],
          })),
        },
      },
      include: {
        assignments: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                category: true,
                difficulty: true,
                imageUrl: true,
                videoUrl: true,
                instructionsAr: true,
                defaultSets: true,
                defaultReps: true,
                defaultHoldTime: true,
                defaultRestTime: true,
              },
            },
          },
        },
        patient: {
          select: { id: true, name: true },
        },
      },
    });

    // Update exercise usage counts
    for (const exerciseId of exerciseIds) {
      await this.prisma.exercise.update({
        where: { id: exerciseId },
        data: { usageCount: { increment: 1 } },
      });
    }

    return prescription;
  }

  async getPrescription(prescriptionId: string) {
    const prescription = await this.prisma.exercisePrescription.findUnique({
      where: { id: prescriptionId },
      include: {
        assignments: {
          include: {
            exercise: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        therapist: {
          select: {
            id: true,
            name: true,
          },
        },
        appointment: {
          select: {
            id: true,
            dateTime: true,
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return prescription;
  }

  async getPatientPrescriptions(
    patientId: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const where: any = {
      patientId,
    };

    if (status) {
      where.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      this.prisma.exercisePrescription.findMany({
        where,
        include: {
          assignments: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                  category: true,
                  imageUrl: true,
                },
              },
            },
          },
          therapist: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.exercisePrescription.count({ where }),
    ]);

    return {
      prescriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTherapistPrescriptions(
    therapistId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const [prescriptions, total] = await Promise.all([
      this.prisma.exercisePrescription.findMany({
        where: { therapistId },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          assignments: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.exercisePrescription.count({ where: { therapistId } }),
    ]);

    return {
      prescriptions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updatePrescription(prescriptionId: string, data: any) {
    const prescription = await this.prisma.exercisePrescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return this.prisma.exercisePrescription.update({
      where: { id: prescriptionId },
      data,
      include: {
        assignments: {
          include: {
            exercise: true,
          },
        },
      },
    });
  }

  async completePrescription(prescriptionId: string) {
    const prescription = await this.prisma.exercisePrescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return this.prisma.exercisePrescription.update({
      where: { id: prescriptionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        isActive: false,
      },
    });
  }

  async cancelPrescription(prescriptionId: string) {
    const prescription = await this.prisma.exercisePrescription.findUnique({
      where: { id: prescriptionId },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    return this.prisma.exercisePrescription.update({
      where: { id: prescriptionId },
      data: {
        status: 'CANCELLED',
        isActive: false,
      },
    });
  }

  // Exercise Log Methods
  async logExerciseCompletion(data: {
    assignmentId: string;
    setsCompleted?: number;
    repsCompleted?: number;
    painLevel?: number;
    difficulty?: string;
    notes?: string;
    duration?: number;
  }) {
    const assignment = await this.prisma.exerciseAssignment.findUnique({
      where: { id: data.assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Exercise assignment not found');
    }

    // Create log entry
    const log = await this.prisma.exerciseLog.create({
      data: {
        assignmentId: data.assignmentId,
        setsCompleted: data.setsCompleted || 0,
        repsCompleted: data.repsCompleted || 0,
        painLevel: data.painLevel,
        difficulty: data.difficulty,
        notes: data.notes,
        duration: data.duration,
      },
    });

    // Update assignment
    await this.prisma.exerciseAssignment.update({
      where: { id: data.assignmentId },
      data: {
        completedCount: { increment: 1 },
        lastCompletedAt: new Date(),
        painLevel: data.painLevel,
        difficulty: data.difficulty,
        patientNotes: data.notes,
      },
    });

    return log;
  }

  async getPatientExerciseHistory(patientId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.exerciseLog.findMany({
      where: {
        assignment: {
          prescription: {
            patientId,
          },
        },
        completedAt: {
          gte: startDate,
        },
      },
      include: {
        assignment: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Group by date
    const groupedByDate = logs.reduce((acc, log) => {
      const dateKey = log.completedAt.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(log);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate statistics
    const statistics = {
      totalExercisesCompleted: logs.length,
      totalSetsCompleted: logs.reduce((sum, log) => sum + log.setsCompleted, 0),
      totalRepsCompleted: logs.reduce((sum, log) => sum + log.repsCompleted, 0),
      averagePainLevel: logs.length > 0 
        ? logs.reduce((sum, log) => sum + (log.painLevel || 0), 0) / logs.length 
        : 0,
      complianceRate: this.calculateComplianceRate(logs),
    };

    return {
      logs,
      groupedByDate,
      statistics,
    };
  }

  private calculateComplianceRate(logs: any[]): number {
    // This is a simplified compliance calculation
    // In a real implementation, this would compare against prescribed frequency
    const uniqueDays = new Set(logs.map((log) => 
      log.completedAt.toISOString().split('T')[0]
    ));
    
    // Assume 30 days period for compliance calculation
    const expectedDays = 30;
    return Math.min((uniqueDays.size / expectedDays) * 100, 100);
  }
}
