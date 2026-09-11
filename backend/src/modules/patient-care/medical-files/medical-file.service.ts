import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MedicalFileService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private auditService: AuditService,
  ) {}

  async uploadMedicalFile(
    patientId: string,
    file: Express.Multer.File,
    category: string,
    description?: string,
    uploadedById: string,
    appointmentId?: string,
  ) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Get settings for file constraints
    const settings = await this.prisma.settings.findFirst();
    const maxFileSize = settings?.maxMedicalFileSize || 10 * 1024 * 1024; // Default 10MB
    const allowedTypes = settings?.allowedMedicalFileTypes || [
      'image/jpeg',
      'image/png',
      'application/pdf',
      'application/dicom',
    ];

    // Validate file size
    if (file.size > maxFileSize) {
      throw new BadRequestException(
        `File size exceeds ${maxFileSize / 1024 / 1024}MB limit`,
      );
    }

    // Validate file type
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
      );
    }

    // Save medical file
    const medicalFile = await this.prisma.medicalFile.create({
      data: {
        patientId,
        fileName: this.generateFileName(file.originalname),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer.toString('base64'),
        category,
        description,
        uploadedById,
        appointmentId,
      },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId: uploadedById,
      action: 'UPLOAD',
      entityType: 'medical_file',
      entityId: medicalFile.id,
      details: {
        patientId,
        category,
        fileName: file.originalname,
        size: file.size,
      },
    });

    return medicalFile;
  }

  async getPatientMedicalFiles(patientId: string, userId: string, userRole: string) {
    // Check authorization: patients can only see their own files
    if (userRole === 'PATIENT' && patientId !== userId) {
      throw new ForbiddenException('You can only access your own medical files');
    }

    const files = await this.prisma.medicalFile.findMany({
      where: {
        patientId,
        isActive: true,
      },
      select: {
        id: true,
        fileName: true,
        originalName: true,
        mimeType: true,
        size: true,
        category: true,
        description: true,
        createdAt: true,
        appointmentId: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'VIEW',
      entityType: 'medical_file',
      entityId: patientId,
      details: { patientId, fileCount: files.length },
    });

    return files;
  }

  async downloadMedicalFile(fileId: string, userId: string, userRole: string) {
    const file = await this.prisma.medicalFile.findUnique({
      where: { id: fileId },
      include: { patient: true },
    });

    if (!file || !file.isActive) {
      throw new NotFoundException('File not found');
    }

    // Authorization check
    if (userRole === 'PATIENT' && file.patient.userId !== userId) {
      throw new ForbiddenException('You can only download your own medical files');
    }

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'DOWNLOAD',
      entityType: 'medical_file',
      entityId: fileId,
      details: { patientId: file.patientId, fileName: file.originalName },
    });

    return {
      data: Buffer.from(file.data, 'base64'),
      mimeType: file.mimeType,
      fileName: file.originalName,
    };
  }

  async deleteMedicalFile(fileId: string, userId: string) {
    const file = await this.prisma.medicalFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Soft delete
    await this.prisma.medicalFile.update({
      where: { id: fileId },
      data: { isActive: false },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'DELETE',
      entityType: 'medical_file',
      entityId: fileId,
      details: { patientId: file.patientId, fileName: file.originalName },
    });

    return { success: true };
  }

  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${random}.${extension}`;
  }
}
