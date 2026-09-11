// backend/src/services/medical-file.service.ts
// P3: Medical File Upload - X-rays, MRI reports, referrals

import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { Prisma } from '@prisma/client';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/dicom',
];

const ALLOWED_CATEGORIES = [
  'xray',
  'mri',
  'ct_scan',
  'referral',
  'lab_report',
  'doctor_note',
  'other',
];

/**
 * Upload a medical file
 */
export async function uploadMedicalFile(
  patientId: string,
  file: Express.Multer.File,
  category: string,
  description: string | undefined,
  uploadedById: string,
  appointmentId?: string
) {
  // Validate patient exists
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new HttpError(404, 'المريض غير موجود');
  }

  // Validate category
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new HttpError(400, `فئة غير صحيحة. الفئات المتاحة: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new HttpError(400, `حجم الملف يتجاوز 10 ميجابايت`);
  }

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new HttpError(400, `نوع ملف غير صحيح. الأنواع المتاحة: JPEG, PNG, PDF, DICOM`);
  }

  // Generate unique filename
  const fileName = generateFileName(file.originalname);

  // Save medical file
  const medicalFile = await prisma.medicalFile.create({
    data: {
      patientId,
      appointmentId,
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      data: file.buffer.toString('base64'),
      category,
      description,
      uploadedById,
    },
  });

  return {
    id: medicalFile.id,
    fileName: medicalFile.originalName,
    category: medicalFile.category,
    mimeType: medicalFile.mimeType,
    size: medicalFile.size,
    createdAt: medicalFile.createdAt,
  };
}

/**
 * Get patient's medical files
 */
export async function getPatientMedicalFiles(
  patientId: string,
  userId: string,
  userRole: string,
  category?: string
) {
  // Authorization check
  if (userRole === 'PATIENT') {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, userId },
    });
    if (!patient) {
      throw new HttpError(403, 'يمكنك فقط الوصول إلى ملفاتك الطبية');
    }
  }

  const where: Prisma.MedicalFileWhereInput = {
    patientId,
    isActive: true,
  };

  if (category) {
    where.category = category;
  }

  const files = await prisma.medicalFile.findMany({
    where,
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

  return files;
}

/**
 * Download a medical file
 */
export async function downloadMedicalFile(
  fileId: string,
  userId: string,
  userRole: string
) {
  const file = await prisma.medicalFile.findUnique({
    where: { id: fileId },
    include: { patient: true },
  });

  if (!file || !file.isActive) {
    throw new HttpError(404, 'الملف غير موجود');
  }

  // Authorization check
  if (userRole === 'PATIENT' && file.patient.userId !== userId) {
    throw new HttpError(403, 'يمكنك فقط تحميل ملفاتك الطبية');
  }

  return {
    data: Buffer.from(file.data, 'base64'),
    mimeType: file.mimeType,
    fileName: file.originalName,
  };
}

/**
 * Soft delete a medical file
 */
export async function deleteMedicalFile(fileId: string, userId: string) {
  const file = await prisma.medicalFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    throw new HttpError(404, 'الملف غير موجود');
  }

  await prisma.medicalFile.update({
    where: { id: fileId },
    data: { isActive: false },
  });

  return { success: true };
}

/**
 * Generate unique filename
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = originalName.split('.').pop();
  return `${timestamp}_${random}.${extension}`;
}
