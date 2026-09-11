import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PainMapService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async addPainMarker(
    patientId: string,
    painData: {
      bodyView: string;
      xCoordinate: number;
      yCoordinate: number;
      painIntensity: number;
      painType: string;
      painDescription?: string;
      appointmentId?: string;
    },
    userId: string,
  ) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate coordinates
    if (painData.xCoordinate < 0 || painData.xCoordinate > 100) {
      throw new BadRequestException('X coordinate must be between 0 and 100');
    }
    if (painData.yCoordinate < 0 || painData.yCoordinate > 100) {
      throw new BadRequestException('Y coordinate must be between 0 and 100');
    }

    // Validate pain intensity
    if (painData.painIntensity < 0 || painData.painIntensity > 10) {
      throw new BadRequestException('Pain intensity must be between 0 and 10');
    }

    // Validate body view
    const validBodyViews = ['front', 'back', 'left', 'right'];
    if (!validBodyViews.includes(painData.bodyView)) {
      throw new BadRequestException(
        `Invalid body view. Must be one of: ${validBodyViews.join(', ')}`,
      );
    }

    // Validate pain type
    const validPainTypes = [
      'sharp',
      'dull',
      'burning',
      'throbbing',
      'stabbing',
      'numbness',
      'tingling',
    ];
    if (!validPainTypes.includes(painData.painType)) {
      throw new BadRequestException(
        `Invalid pain type. Must be one of: ${validPainTypes.join(', ')}`,
      );
    }

    // Save pain marker
    const painMarker = await this.prisma.painMap.create({
      data: {
        patientId,
        ...painData,
      },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'CREATE',
      entityType: 'pain_map',
      entityId: painMarker.id,
      details: {
        patientId,
        bodyView: painData.bodyView,
        painIntensity: painData.painIntensity,
      },
    });

    return painMarker;
  }

  async getPatientPainHistory(
    patientId: string,
    userId: string,
    userRole: string,
    dateFrom?: Date,
    dateTo?: Date,
  ) {
    // Authorization check
    if (userRole === 'PATIENT' && patientId !== userId) {
      throw new BadRequestException('You can only access your own pain history');
    }

    const where: any = { patientId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    return this.prisma.painMap.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPainMapForAppointment(appointmentId: string) {
    return this.prisma.painMap.findMany({
      where: { appointmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deletePainMarker(markerId: string, userId: string) {
    const marker = await this.prisma.painMap.findUnique({
      where: { id: markerId },
    });

    if (!marker) {
      throw new NotFoundException('Pain marker not found');
    }

    await this.prisma.painMap.delete({
      where: { id: markerId },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'DELETE',
      entityType: 'pain_map',
      entityId: markerId,
      details: { patientId: marker.patientId },
    });

    return { success: true };
  }

  async getPainStatistics(patientId: string, dateFrom?: Date, dateTo?: Date) {
    const where: any = { patientId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const painMarkers = await this.prisma.painMap.findMany({
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
        ? painMarkers.reduce((sum, marker) => sum + marker.painIntensity, 0) /
          totalMarkers
        : 0;

    const painTypeDistribution = painMarkers.reduce((acc, marker) => {
      acc[marker.painType] = (acc[marker.painType] || 0) + 1;
      return acc;
    }, {});

    const bodyViewDistribution = painMarkers.reduce((acc, marker) => {
      acc[marker.bodyView] = (acc[marker.bodyView] || 0) + 1;
      return acc;
    }, {});

    return {
      totalMarkers,
      averageIntensity,
      painTypeDistribution,
      bodyViewDistribution,
    };
  }
}
