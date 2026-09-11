// backend/src/routes/patient-care.routes.ts
// Phase 4: Patient Care - All routes (P1-P5)

import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as controller from '../controllers/patient-care.controller.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// ============================================================
// P1: INTAKE FORMS
// ============================================================

// Get form templates (all authenticated users)
router.get('/forms/templates', 
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'), 
  controller.getFormTemplates
);

// Start intake form
router.post('/forms/start',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.startIntakeForm
);

// Save form progress
router.put('/forms/:id/progress',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.saveFormProgress
);

// Submit form
router.put('/forms/:id/submit',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.submitIntakeForm
);

// Get patient forms
router.get('/forms/patient/:patientId',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.getPatientForms
);

// Get form by ID
router.get('/forms/:id',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.getIntakeFormById
);

// ============================================================
// P2: CONSENT FORMS
// ============================================================

// Get consent templates
router.get('/consents/templates',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.getConsentTemplates
);

// Sign consent
router.post('/consents/sign',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.signConsent
);

// Get patient consents
router.get('/consents/patient/:patientId',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.getPatientConsents
);

// Verify consent
router.get('/consents/:id/verify',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.verifyConsent
);

// ============================================================
// P3: MEDICAL FILES
// ============================================================

// Upload medical file
router.post('/files/upload',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.uploadMedicalFile
);

// Get patient medical files
router.get('/files/patient/:patientId',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.getPatientMedicalFiles
);

// Download medical file
router.get('/files/:id/download',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.downloadMedicalFile
);

// Delete medical file
router.delete('/files/:id',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.deleteMedicalFile
);

// ============================================================
// P4: PAIN MAP
// ============================================================

// Add pain marker
router.post('/pain-map/marker',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.addPainMarker
);

// Get patient pain history
router.get('/pain-map/patient/:patientId/history',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.getPatientPainHistory
);

// Get appointment pain map
router.get('/pain-map/appointment/:appointmentId',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getAppointmentPainMap
);

// Get pain statistics
router.get('/pain-map/patient/:patientId/statistics',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getPainStatistics
);

// Get pain trend
router.get('/pain-map/patient/:patientId/trend',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getPainTrend
);

// Delete pain marker
router.delete('/pain-map/marker/:id',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.deletePainMarker
);

// ============================================================
// P5: PHOTO PROGRESS
// ============================================================

// Upload progress photo
router.post('/photos/upload',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.uploadProgressPhoto
);

// Get photo timeline
router.get('/photos/patient/:patientId/timeline',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.getPhotoTimeline
);

// Get photo by ID
router.get('/photos/:id',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.getPhotoById
);

// Compare photos
router.get('/photos/compare',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY', 'PATIENT'),
  controller.comparePhotos
);

// Delete photo
router.delete('/photos/:id',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.deletePhoto
);

// Get photo statistics
router.get('/photos/patient/:patientId/statistics',
  requireRole('OWNER', 'THERAPIST', 'SECRETARY'),
  controller.getPhotoStatistics
);

export default router;
