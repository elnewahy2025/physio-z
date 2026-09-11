import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class ExerciseService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
  ) {}

  async createExercise(data: {
    name: string;
    nameAr: string;
    category: string;
    difficulty?: string;
    description: string;
    descriptionAr: string;
    instructions: string;
    instructionsAr: string;
    startingPosition?: string;
    endingPosition?: string;
    position?: string;
    imageUrl?: string;
    videoUrl?: string;
    animationUrl?: string;
    defaultSets?: number;
    defaultReps?: number;
    defaultHoldTime?: number;
    defaultRestTime?: number;
    contraindications?: string;
    precautions?: string;
    commonErrors?: string;
    progressions?: string;
    regressions?: string;
    tags?: string[];
    bodyParts?: string[];
    equipment?: string[];
    createdById: string;
  }) {
    // Validate required fields
    if (!data.name || !data.nameAr) {
      throw new BadRequestException('Both English and Arabic names are required');
    }

    if (!data.description || !data.descriptionAr) {
      throw new BadRequestException('Both English and Arabic descriptions are required');
    }

    if (!data.instructions || !data.instructionsAr) {
      throw new BadRequestException('Both English and Arabic instructions are required');
    }

    // Check for duplicate name
    const existing = await this.prisma.exercise.findFirst({
      where: {
        OR: [
          { name: data.name },
          { nameAr: data.nameAr },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('Exercise with this name already exists');
    }

    // Create exercise
    const exercise = await this.prisma.exercise.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        category: data.category as any,
        difficulty: (data.difficulty || 'BEGINNER') as any,
        description: data.description,
        descriptionAr: data.descriptionAr,
        instructions: data.instructions,
        instructionsAr: data.instructionsAr,
        startingPosition: data.startingPosition,
        endingPosition: data.endingPosition,
        position: data.position as any,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        animationUrl: data.animationUrl,
        defaultSets: data.defaultSets || 3,
        defaultReps: data.defaultReps || 10,
        defaultHoldTime: data.defaultHoldTime,
        defaultRestTime: data.defaultRestTime || 60,
        contraindications: data.contraindications,
        precautions: data.precautions,
        commonErrors: data.commonErrors,
        progressions: data.progressions,
        regressions: data.regressions,
        tags: data.tags || [],
        bodyParts: data.bodyParts || [],
        equipment: data.equipment || [],
        createdById: data.createdById,
      },
    });

    return exercise;
  }

  async updateExercise(exerciseId: string, data: any) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Handle category and difficulty if provided
    const updateData = { ...data };
    if (updateData.category) {
      updateData.category = updateData.category as any;
    }
    if (updateData.difficulty) {
      updateData.difficulty = updateData.difficulty as any;
    }
    if (updateData.position) {
      updateData.position = updateData.position as any;
    }

    return this.prisma.exercise.update({
      where: { id: exerciseId },
      data: updateData,
    });
  }

  async deleteExercise(exerciseId: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: { assignments: true },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Soft delete if exercise is used in prescriptions
    if (exercise.assignments.length > 0) {
      return this.prisma.exercise.update({
        where: { id: exerciseId },
        data: { isActive: false },
      });
    }

    // Hard delete if not used
    return this.prisma.exercise.delete({
      where: { id: exerciseId },
    });
  }

  async getExercise(exerciseId: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        assignments: {
          include: {
            prescription: {
              include: {
                patient: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }

    // Increment usage count
    await this.prisma.exercise.update({
      where: { id: exerciseId },
      data: { usageCount: { increment: 1 } },
    });

    return exercise;
  }

  async getExercises(filters?: {
    category?: string;
    difficulty?: string;
    bodyPart?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const where: any = {
      isActive: filters?.isActive ?? true,
    };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters?.bodyPart) {
      where.bodyParts = {
        has: filters.bodyPart,
      };
    }

    if (filters?.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          nameAr: {
            contains: filters.search,
          },
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          descriptionAr: {
            contains: filters.search,
          },
        },
        {
          tags: {
            has: filters.search,
          },
        },
      ];
    }

    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' },
          { name: 'asc' },
        ],
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          nameAr: true,
          category: true,
          difficulty: true,
          description: true,
          descriptionAr: true,
          imageUrl: true,
          videoUrl: true,
          defaultSets: true,
          defaultReps: true,
          defaultHoldTime: true,
          defaultRestTime: true,
          tags: true,
          bodyParts: true,
          equipment: true,
          usageCount: true,
        },
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return {
      exercises,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getExerciseCategories() {
    const categories = await this.prisma.exercise.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: {
        category: true,
      },
      _avg: {
        usageCount: true,
      },
    });

    return categories.map((cat) => ({
      category: cat.category,
      count: cat._count.category,
      averageUsage: cat._avg.usageCount,
    }));
  }

  async getPopularExercises(limit: number = 10) {
    return this.prisma.exercise.findMany({
      where: { isActive: true },
      orderBy: { usageCount: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        nameAr: true,
        category: true,
        difficulty: true,
        usageCount: true,
        imageUrl: true,
      },
    });
  }

  async searchExercises(query: string) {
    if (!query || query.length < 2) {
      return [];
    }

    return this.prisma.exercise.findMany({
      where: {
        isActive: true,
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            nameAr: {
              contains: query,
            },
          },
          {
            tags: {
              has: query,
            },
          },
        ],
      },
      take: 20,
      orderBy: { usageCount: 'desc' },
      select: {
        id: true,
        name: true,
        nameAr: true,
        category: true,
        difficulty: true,
        imageUrl: true,
      },
    });
  }
}
