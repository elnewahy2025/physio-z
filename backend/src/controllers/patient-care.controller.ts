// backend/src/controllers/patient-care.controller.ts
// Phase 4: Patient Care - All controllers (P1-P5)

import { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { HttpError } from '../lib/errors.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as intakeFormService from '../services/intake-form.service.js';
import * as consentFormService from '../services/consent-form.service.js';
import * as medicalFileService from '../services/medical-file.service.js';
import * as painMapService from '../services/pain-map.service.js';
import * as photoProgressService from '../services/photo-progress.service.js';

// Configure multer for memory storage (for base64 conversion)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// ============================================================
// P1: INTAKE FORMS
// ============================================================

// Get form templates
export const getFormTemplates = asyncHandler(async (req: Request, res: Response) => {
  const templates = await intakeFormService.getFormTemplates();
  res.json(templates);
});

// Start intake form
const startFormSchema = z.object({
  patientId: z.string().min(1, 'Patient ID required'),
  formType: z.string().min(1, 'Form type required'),
});

export const startIntakeForm = asyncHandler(async (req: Request, res: Response) => {
  const { patientId, formType } = startFormSchema.parse(req.body);
  
  // If patient is starting their own form, use their ID
  let targetPatientId = patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const form = await intakeFormService.startIntakeForm(targetPatientId, formType);
  res.status(201).json(form);
});

// Save form progress
const saveProgressSchema = z.object({
  formData: z.record(z.any()),
});

export const saveFormProgress = asyncHandler(async (req: Request, res: Response) => {
  const formId = req.params.id;
  const { formData } = saveProgressSchema.parse(req.body);
  
  const form = await intakeFormService.saveFormProgress(formId, formData);
  res.json(form);
});

// Submit form
const submitFormSchema = z.object({
  formData: z.record(z.any()),
});

export const submitIntakeForm = asyncHandler(async (req: Request, res: Response) => {
  const formId = req.params.id;
  const { formData } = submitFormSchema.parse(req.body);
  
  const form = await intakeFormService.submitIntakeForm(
    formId,
    formData,
    req.ip,
    req.headers['user-agent']
  );
  
  res.json(form);
});

// Get patient forms
export const getPatientForms = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  
  // If patient is requesting their own forms
  let targetPatientId = patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const forms = await intakeFormService.getPatientForms(
    targetPatientId,
    req.userId || '',
    req.userRole || 'PATIENT'
  );
  
  res.json(forms);
});

// Get form by ID
export const getIntakeFormById = asyncHandler(async (req: Request, res: Response) => {
  const formId = req.params.id;
  const form = await intakeFormService.getIntakeFormById(
    formId,
    req.userId || '',
    req.userRole || 'PATIENT'
  );
  res.json(form);
});

// ============================================================
// P2: CONSENT FORMS
// ============================================================

// Get consent templates
export const getConsentTemplates = asyncHandler(async (req: Request, res: Response) => {
  const templates = await consentFormService.getConsentTemplates();
  res.json(templates);
});

// Sign consent
const signConsentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID required'),
  consentType: z.string().min(1, 'Consent type required'),
  signatureData: z.string().min(1, 'Signature data required'),
  witnessName: z.string().optional(),
});

export const signConsent = asyncHandler(async (req: Request, res: Response) => {
  const data = signConsentSchema.parse(req.body);
  
  // If patient is signing for themselves
  let targetPatientId = data.patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const consent = await consentFormService.signConsent(
    targetPatientId,
    data.consentType,
    data.signatureData,
    req.userId || '',
    req.ip,
    req.headers['user-agent'],
    data.witnessName
  );
  
  res.status(201).json(consent);
});

// Get patient consents
export const getPatientConsents = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  
  let targetPatientId = patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const consents = await consentFormService.getPatientConsents(
    targetPatientId,
    req.userId || '',
    req.userRole || 'PATIENT'
  );
  
  res.json(consents);
});

// Verify consent
export const verifyConsent = asyncHandler(async (req: Request, res: Response) => {
  const consentId = req.params.id;
  const verification = await consentFormService.verifyConsent(consentId);
  res.json(verification);
});

// ============================================================
// P3: MEDICAL FILES
// ============================================================

// Upload medical file
export const uploadMedicalFile = [
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم تحديد ملف' });
    }
    
    const patientId = req.body.patientId;
    const category = req.body.category;
    const description = req.body.description;
    const appointmentId = req.body.appointmentId;
    
    // If patient is uploading for themselves
    let targetPatientId = patientId;
    if (req.userRole === 'PATIENT' && req.userId) {
      targetPatientId = await getOwnPatientId(req.userId);
    }
    
    const file = await medicalFileService.uploadMedicalFile(
      targetPatientId,
      req.file,
      category,
      description,
      req.userId || '',
      appointmentId
    );
    
    res.status(201).json(file);
  })
];

// Get patient medical files
export const getPatientMedicalFiles = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const category = req.query.category as string | undefined;
  
  let targetPatientId = patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const files = await medicalFileService.getPatientMedicalFiles(
    targetPatientId,
    req.userId || '',
    req.userRole || 'PATIENT',
    category
  );
  
  res.json(files);
});

// Download medical file
export const downloadMedicalFile = asyncHandler(async (req: Request, res: Response) => {
  const fileId = req.params.id;
  
  const file = await medicalFileService.downloadMedicalFile(
    fileId,
    req.userId || '',
    req.userRole || 'PATIENT'
  );
  
  if (req.query.format === 'base64') {
    return res.json({
      mimeType: file.mimeType,
      fileName: file.fileName,
      data: file.data.toString('base64'),
    });
  }

  res.set({
    'Content-Type': file.mimeType,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
  });
  
  res.send(file.data);
});

// Delete medical file
export const deleteMedicalFile = asyncHandler(async (req: Request, res: Response) => {
  const fileId = req.params.id;
  
  const result = await medicalFileService.deleteMedicalFile(fileId, req.userId || '');
  res.json(result);
});

// ============================================================
// P4: PAIN MAP
// ============================================================

// Add pain marker
const painMarkerSchema = z.object({
  patientId: z.string().min(1, 'Patient ID required'),
  bodyView: z.enum(['front', 'back', 'left', 'right']),
  xCoordinate: z.number().min(0).max(100),
  yCoordinate: z.number().min(0).max(100),
  painIntensity: z.number().min(0).max(10),
  painType: z.enum(['sharp', 'dull', 'burning', 'throbbing', 'stabbing', 'numbness', 'tingling']),
  painDescription: z.string().optional(),
  bodyRegion: z.string().optional(),
  appointmentId: z.string().optional(),
});

export const addPainMarker = asyncHandler(async (req: Request, res: Response) => {
  const data = painMarkerSchema.parse(req.body);
  
  // If patient is adding for themselves
  let targetPatientId = data.patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const marker = await painMapService.addPainMarker(
    targetPatientId,
    data,
    req.userId || ''
  );
  
  res.status(201).json(marker);
});

// Get patient pain history
export const getPatientPainHistory = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  
  let targetPatientId = patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const history = await painMapService.getPatientPainHistory(
    targetPatientId,
    req.userId || '',
    req.userRole || 'PATIENT',
    dateFrom ? new Date(dateFrom) : undefined,
    dateTo ? new Date(dateTo) : undefined
  );
  
  res.json(history);
});

// Get appointment pain map
export const getAppointmentPainMap = asyncHandler(async (req: Request, res: Response) => {
  const appointmentId = req.params.appointmentId;
  const painMap = await painMapService.getAppointmentPainMap(appointmentId);
  res.json(painMap);
});

// Get pain statistics
export const getPainStatistics = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  
  const stats = await painMapService.getPainStatistics(
    patientId,
    dateFrom ? new Date(dateFrom) : undefined,
    dateTo ? new Date(dateTo) : undefined
  );
  
  res.json(stats);
});

// Get pain trend
export const getPainTrend = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const days = req.query.days ? parseInt(req.query.days as string) : 30;
  
  const trend = await painMapService.getPainTrend(patientId, days);
  res.json(trend);
});

// Delete pain marker
export const deletePainMarker = asyncHandler(async (req: Request, res: Response) => {
  const markerId = req.params.id;
  const result = await painMapService.deletePainMarker(markerId, req.userId || '');
  res.json(result);
});

// ============================================================
// P5: PHOTO PROGRESS
// ============================================================

// Upload progress photo
export const uploadProgressPhoto = [
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم تحديد صورة' });
    }
    
    const patientId = req.body.patientId;
    const photoDate = new Date(req.body.photoDate);
    const photoType = req.body.photoType;
    const bodyPart = req.body.bodyPart;
    const notes = req.body.notes;
    const appointmentId = req.body.appointmentId;
    
    // Validate photo date is not in future
    if (photoDate > new Date()) {
      return res.status(400).json({ message: 'تاريخ الصورة لا يمكن أن يكون في المستقبل' });
    }
    
    let targetPatientId = patientId;
    if (req.userRole === 'PATIENT' && req.userId) {
      targetPatientId = await getOwnPatientId(req.userId);
    }
    
    const photo = await photoProgressService.uploadProgressPhoto(
      targetPatientId,
      req.file,
      {
        photoDate,
        photoType,
        bodyPart,
        notes,
      },
      req.userId || '',
      appointmentId
    );
    
    res.status(201).json(photo);
  })
];

// Get photo timeline
export const getPhotoTimeline = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  
  let targetPatientId = patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const timeline = await photoProgressService.getPhotoTimeline(
    targetPatientId,
    req.userId || '',
    req.userRole || 'PATIENT'
  );
  
  res.json(timeline);
});

// Get photo by ID
export const getPhotoById = asyncHandler(async (req: Request, res: Response) => {
  const photoId = req.params.id;
  
  const photo = await photoProgressService.getPhotoById(
    photoId,
    req.userId || '',
    req.userRole || 'PATIENT'
  );
  
  res.json(photo);
});

// Compare photos
export const comparePhotos = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const beforeId = req.query.beforeId as string;
  const afterId = req.query.afterId as string;
  
  if (!beforeId || !afterId) {
    return res.status(400).json({ message: 'معرفات الصور مطلوبة' });
  }
  
  let targetPatientId = patientId;
  if (req.userRole === 'PATIENT' && req.userId) {
    targetPatientId = await getOwnPatientId(req.userId);
  }
  
  const comparison = await photoProgressService.comparePhotos(
    targetPatientId,
    beforeId,
    afterId,
    req.userId || '',
    req.userRole || 'PATIENT'
  );
  
  res.json(comparison);
});

// Delete photo
export const deletePhoto = asyncHandler(async (req: Request, res: Response) => {
  const photoId = req.params.id;
  const result = await photoProgressService.deletePhoto(photoId, req.userId || '');
  res.json(result);
});

// Get photo statistics
export const getPhotoStatistics = asyncHandler(async (req: Request, res: Response) => {
  const patientId = req.params.patientId;
  const stats = await photoProgressService.getPhotoStatistics(patientId);
  res.json(stats);
});

// ============================================================
// HELPER: Get own patient ID for PATIENT role
// ============================================================
async function getOwnPatientId(userId: string): Promise<string> {
  const { prisma } = await import('../lib/prisma.js');
  const patient = await prisma.patient.findFirst({
    where: { userId },
  });
  
  if (!patient) {
    throw new HttpError(404, 'لم يتم العثور على ملف مريض');
  }
  
  return patient.id;
}
