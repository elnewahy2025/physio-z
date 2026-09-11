import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import * as sharp from 'sharp';

@Injectable()
export class PhotoProgressService {
  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private auditService: AuditService,
  ) {}

  async uploadProgressPhoto(
    patientId: string,
    file: Express.Multer.File,
    photoData: {
      photoDate: Date;
      photoType: string;
      bodyPart?: string;
      notes?: string;
    },
    takenById: string,
    appointmentId?: string,
  ) {
    // Validate patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Validate photo type
    const validPhotoTypes = ['before', 'during', 'after'];
    if (!validPhotoTypes.includes(photoData.photoType)) {
      throw new BadRequestException(
        `Invalid photo type. Must be one of: ${validPhotoTypes.join(', ')}`,
      );
    }

    // Get settings for photo constraints
    const settings = await this.prisma.settings.findFirst();
    const maxPhotoSize = settings?.maxPhotoSize || 5 * 1024 * 1024; // Default 5MB
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxPhotoSize) {
      throw new BadRequestException(
        `Photo size exceeds ${maxPhotoSize / 1024 / 1024}MB limit`,
      );
    }

    if (!allowedImageTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image type. Allowed: ${allowedImageTypes.join(', ')}`,
      );
    }

    // Process image
    const processedImage = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Create thumbnail
    const thumbnail = await sharp(file.buffer)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    // Save photo
    const photo = await this.prisma.progressPhoto.create({
      data: {
        patientId,
        photoDate: photoData.photoDate,
        photoType: photoData.photoType,
        bodyPart: photoData.bodyPart,
        notes: photoData.notes,
        imageData: processedImage.toString('base64'),
        thumbnailData: thumbnail.toString('base64'),
        takenById,
        appointmentId,
      },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId: takenById,
      action: 'UPLOAD',
      entityType: 'progress_photo',
      entityId: photo.id,
      details: {
        patientId,
        photoType: photoData.photoType,
        bodyPart: photoData.bodyPart,
      },
    });

    return photo;
  }

  async getPhotoTimeline(patientId: string, userId: string, userRole: string) {
    // Authorization check
    if (userRole === 'PATIENT' && patientId !== userId) {
      throw new ForbiddenException('You can only access your own photos');
    }

    const photos = await this.prisma.progressPhoto.findMany({
      where: { patientId },
      select: {
        id: true,
        photoDate: true,
        photoType: true,
        bodyPart: true,
        notes: true,
        thumbnailData: true,
        createdAt: true,
      },
      orderBy: { photoDate: 'desc' },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'VIEW',
      entityType: 'progress_photo',
      entityId: patientId,
      details: { patientId, photoCount: photos.length },
    });

    return photos;
  }

  async getPhotoById(photoId: string, userId: string, userRole: string) {
    const photo = await this.prisma.progressPhoto.findUnique({
      where: { id: photoId },
      include: { patient: true },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    // Authorization check
    if (userRole === 'PATIENT' && photo.patient.userId !== userId) {
      throw new ForbiddenException('You can only access your own photos');
    }

    return {
      id: photo.id,
      photoDate: photo.photoDate,
      photoType: photo.photoType,
      bodyPart: photo.bodyPart,
      notes: photo.notes,
      imageData: photo.imageData,
      createdAt: photo.createdAt,
    };
  }

  async comparePhotos(
    patientId: string,
    beforePhotoId: string,
    afterPhotoId: string,
    userId: string,
  ) {
    const [before, after] = await Promise.all([
      this.prisma.progressPhoto.findUnique({
        where: { id: beforePhotoId },
      }),
      this.prisma.progressPhoto.findUnique({
        where: { id: afterPhotoId },
      }),
    ]);

    if (!before || !after) {
      throw new NotFoundException('One or both photos not found');
    }

    // Authorization check
    if (userRole === 'PATIENT' && before.patientId !== userId) {
      throw new ForbiddenException('You can only compare your own photos');
    }

    const daysBetween = Math.abs(
      (after.photoDate.getTime() - before.photoDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      before: {
        id: before.id,
        photoDate: before.photoDate,
        photoType: before.photoType,
        imageData: before.imageData,
      },
      after: {
        id: after.id,
        photoDate: after.photoDate,
        photoType: after.photoType,
        imageData: after.imageData,
      },
      comparison: {
        daysBetween,
        bodyPart: before.bodyPart || after.bodyPart,
      },
    };
  }

  async deletePhoto(photoId: string, userId: string) {
    const photo = await this.prisma.progressPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    await this.prisma.progressPhoto.delete({
      where: { id: photoId },
    });

    // Log audit trail
    await this.auditService.logAction({
      userId,
      action: 'DELETE',
      entityType: 'progress_photo',
      entityId: photoId,
      details: { patientId: photo.patientId },
    });

    return { success: true };
  }
}
