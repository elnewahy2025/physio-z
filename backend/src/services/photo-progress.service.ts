// backend/src/services/photo-progress.service.ts
// P5: Photo Progress Tracking - Before/during/after photos

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import sharp from 'sharp';

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const VALID_PHOTO_TYPES = ['before', 'during', 'after'];
const VALID_BODY_PARTS = [
  'full_body',
  'head_neck',
  'shoulder',
  'arm',
  'hand',
  'chest',
  'back',
  'abdomen',
  'hip',
  'leg',
  'knee',
  'foot',
];

/**
 * Upload a progress photo
 */
export async function uploadProgressPhoto(
  patientId: string,
  file: Express.Multer.File,
  photoData: {
    photoDate: Date;
    photoType: string;
    bodyPart?: string;
    notes?: string;
  },
  takenById: string,
  appointmentId?: string
) {
  // Validate patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new HttpError(404, 'المريض غير موجود');
  }

  // Validate photo type
  if (!VALID_PHOTO_TYPES.includes(photoData.photoType)) {
    throw new HttpError(400, `نوع صورة غير صحيح. المتاح: ${VALID_PHOTO_TYPES.join(', ')}`);
  }

  // Validate body part if provided
  if (photoData.bodyPart && !VALID_BODY_PARTS.includes(photoData.bodyPart)) {
    throw new HttpError(400, `جزء جسم غير صحيح`);
  }

  // Validate file size
  if (file.size > MAX_PHOTO_SIZE) {
    throw new HttpError(400, `حجم الصورة يتجاوز 5 ميجابايت`);
  }

  // Validate MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new HttpError(400, `نوع صورة غير صحيح. المتاح: JPEG, PNG, WebP`);
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
  const photo = await prisma.progressPhoto.create({
    data: {
      patientId,
      appointmentId,
      photoDate: photoData.photoDate,
      photoType: photoData.photoType,
      bodyPart: photoData.bodyPart,
      notes: photoData.notes,
      imageData: processedImage.toString('base64'),
      thumbnailData: thumbnail.toString('base64'),
      takenById,
    },
  });

  return {
    id: photo.id,
    photoDate: photo.photoDate,
    photoType: photo.photoType,
    bodyPart: photo.bodyPart,
    notes: photo.notes,
    thumbnailUrl: `data:image/jpeg;base64,${photo.thumbnailData}`,
    createdAt: photo.createdAt,
  };
}

/**
 * Get patient's photo timeline
 */
export async function getPhotoTimeline(
  patientId: string,
  userId: string,
  userRole: string
) {
  // Authorization check
  if (userRole === 'PATIENT') {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId },
    });
    if (!patient) {
      throw new HttpError(403, 'يمكنك فقط الوصول إلى صورك');
    }
  }

  const photos = await prisma.progressPhoto.findMany({
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

  // Convert thumbnails to data URLs
  return photos.map(photo => ({
    ...photo,
    thumbnailUrl: `data:image/jpeg;base64,${photo.thumbnailData}`,
    thumbnailData: undefined,
  }));
}

/**
 * Get full photo by ID
 */
export async function getPhotoById(
  photoId: string,
  userId: string,
  userRole: string
) {
  const photo = await prisma.progressPhoto.findUnique({
    where: { id: photoId },
    include: { patient: true },
  });

  if (!photo) {
    throw new HttpError(404, 'الصورة غير موجودة');
  }

  // Authorization check
  if (userRole === 'PATIENT' && photo.patient.userId !== userId) {
    throw new HttpError(403, 'يمكنك فقط الوصول إلى صورك');
  }

  return {
    id: photo.id,
    photoDate: photo.photoDate,
    photoType: photo.photoType,
    bodyPart: photo.bodyPart,
    notes: photo.notes,
    imageUrl: `data:image/jpeg;base64,${photo.imageData}`,
    createdAt: photo.createdAt,
  };
}

/**
 * Compare two photos
 */
export async function comparePhotos(
  patientId: string,
  beforePhotoId: string,
  afterPhotoId: string,
  userId: string,
  userRole: string
) {
  // Authorization check
  if (userRole === 'PATIENT') {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId },
    });
    if (!patient) {
      throw new HttpError(403, 'يمكنك فقط مقارنة صورك');
    }
  }

  const [before, after] = await Promise.all([
    prisma.progressPhoto.findUnique({
      where: { id: beforePhotoId },
    }),
    prisma.progressPhoto.findUnique({
      where: { id: afterPhotoId },
    }),
  ]);

  if (!before || !after) {
    throw new HttpError(404, 'واحدة أو كلا الصورتين غير موجودتين');
  }

  // Verify both photos belong to the same patient
  if (before.patientId !== patientId || after.patientId !== patientId) {
    throw new HttpError(400, 'الصور لا تنتمي لنفس المريض');
  }

  const daysBetween = Math.abs(
    (after.photoDate.getTime() - before.photoDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    before: {
      id: before.id,
      photoDate: before.photoDate,
      photoType: before.photoType,
      imageUrl: `data:image/jpeg;base64,${before.imageData}`,
    },
    after: {
      id: after.id,
      photoDate: after.photoDate,
      photoType: after.photoType,
      imageUrl: `data:image/jpeg;base64,${after.imageData}`,
    },
    comparison: {
      daysBetween: Math.round(daysBetween),
      bodyPart: before.bodyPart || after.bodyPart,
    },
  };
}

/**
 * Delete a progress photo
 */
export async function deletePhoto(photoId: string, userId: string) {
  const photo = await prisma.progressPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo) {
    throw new HttpError(404, 'الصورة غير موجودة');
  }

  await prisma.progressPhoto.delete({
    where: { id: photoId },
  });

  return { success: true };
}

/**
 * Get photo statistics
 */
export async function getPhotoStatistics(patientId: string) {
  const photos = await prisma.progressPhoto.findMany({
    where: { patientId },
    select: {
      photoType: true,
      bodyPart: true,
      photoDate: true,
    },
  });

  const byType = photos.reduce((acc, photo) => {
    acc[photo.photoType] = (acc[photo.photoType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byBodyPart = photos.reduce((acc, photo) => {
    if (photo.bodyPart) {
      acc[photo.bodyPart] = (acc[photo.bodyPart] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const firstPhoto = photos.length > 0 
    ? photos.reduce((earliest, photo) => 
        photo.photoDate < earliest.photoDate ? photo : earliest
      )
    : null;

  const latestPhoto = photos.length > 0
    ? photos.reduce((latest, photo) => 
        photo.photoDate > latest.photoDate ? photo : latest
      )
    : null;

  return {
    totalPhotos: photos.length,
    byType,
    byBodyPart,
    firstPhotoDate: firstPhoto?.photoDate,
    latestPhotoDate: latestPhoto?.photoDate,
  };
}
