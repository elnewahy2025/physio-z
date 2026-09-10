// backend/src/services/file.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
  'application/pdf', 'text/plain',
];

export async function uploadFile(params: {
  filename: string;
  mimeType: string;
  data: string; // base64
  category: string;
  uploadedById: string;
  patientId?: string;
}) {
  // Validate type
  if (!ALLOWED_TYPES.includes(params.mimeType)) {
    throw new HttpError(400, `File type ${params.mimeType} not allowed`);
  }

  // Validate size (base64 is ~1.37x actual size)
  const estimatedSize = Math.floor((params.data.length * 3) / 4);
  if (estimatedSize > MAX_FILE_SIZE) {
    throw new HttpError(400, 'File too large (max 5MB)');
  }

  return prisma.file.create({
    data: {
      filename: params.filename,
      mimeType: params.mimeType,
      size: estimatedSize,
      data: params.data,
      category: params.category,
      uploadedById: params.uploadedById,
      patientId: params.patientId ?? null,
    },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      size: true,
      category: true,
      patientId: true,
      createdAt: true,
    },
  });
}

export async function getFile(id: string) {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new HttpError(404, 'File not found');
  return file;
}

export async function listFiles(patientId?: string, category?: string) {
  const where: Record<string, unknown> = {};
  if (patientId) where.patientId = patientId;
  if (category) where.category = category;

  return prisma.file.findMany({
    where,
    select: {
      id: true, filename: true, mimeType: true, size: true,
      category: true, patientId: true, createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteFile(id: string) {
  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) throw new HttpError(404, 'File not found');
  await prisma.file.delete({ where: { id } });
  return { success: true };
}