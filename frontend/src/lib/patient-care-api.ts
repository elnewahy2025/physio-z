// frontend/src/lib/patient-care-api.ts
// Phase 4: Patient Care - API service

import api from './api.js';

// ============================================================
// P1: INTAKE FORMS
// ============================================================

export const intakeFormApi = {
  getTemplates: async () => {
    const response = await api.get('/patient-care/forms/templates');
    return response.data;
  },

  startForm: async (patientId: string, formType: string) => {
    const response = await api.post('/patient-care/forms/start', {
      patientId,
      formType,
    });
    return response.data;
  },

  saveProgress: async (formId: string, formData: Record<string, any>) => {
    const response = await api.put(`/patient-care/forms/${formId}/progress`, {
      formData,
    });
    return response.data;
  },

  submitForm: async (formId: string, formData: Record<string, any>) => {
    const response = await api.put(`/patient-care/forms/${formId}/submit`, {
      formData,
    });
    return response.data;
  },

  getPatientForms: async (patientId: string) => {
    const response = await api.get(`/patient-care/forms/patient/${patientId}`);
    return response.data;
  },

  getFormById: async (formId: string) => {
    const response = await api.get(`/patient-care/forms/${formId}`);
    return response.data;
  },
};

// ============================================================
// P2: CONSENT FORMS
// ============================================================

export const consentFormApi = {
  getTemplates: async () => {
    const response = await api.get('/patient-care/consents/templates');
    return response.data;
  },

  signConsent: async (data: {
    patientId: string;
    consentType: string;
    signatureData: string;
    witnessName?: string;
  }) => {
    const response = await api.post('/patient-care/consents/sign', data);
    return response.data;
  },

  getPatientConsents: async (patientId: string) => {
    const response = await api.get(`/patient-care/consents/patient/${patientId}`);
    return response.data;
  },

  verifyConsent: async (consentId: string) => {
    const response = await api.get(`/patient-care/consents/${consentId}/verify`);
    return response.data;
  },
};

// ============================================================
// P3: MEDICAL FILES
// ============================================================

export const medicalFileApi = {
  upload: async (patientId: string, file: File, category: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('category', category);
    if (description) formData.append('description', description);
    
    const response = await api.post('/patient-care/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPatientFiles: async (patientId: string, category?: string) => {
    const response = await api.get(`/patient-care/files/patient/${patientId}`, {
      params: category ? { category } : {},
    });
    return response.data;
  },

  downloadFile: async (fileId: string) => {
    const response = await api.get(`/patient-care/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteFile: async (fileId: string) => {
    const response = await api.delete(`/patient-care/files/${fileId}`);
    return response.data;
  },
};

// ============================================================
// P4: PAIN MAP
// ============================================================

export const painMapApi = {
  addMarker: async (data: {
    patientId: string;
    bodyView: 'front' | 'back' | 'left' | 'right';
    xCoordinate: number;
    yCoordinate: number;
    painIntensity: number;
    painType: string;
    painDescription?: string;
  }) => {
    const response = await api.post('/patient-care/pain-map/marker', data);
    return response.data;
  },

  getHistory: async (patientId: string, dateFrom?: string, dateTo?: string) => {
    const response = await api.get(`/patient-care/pain-map/patient/${patientId}/history`, {
      params: { dateFrom, dateTo },
    });
    return response.data;
  },

  getStatistics: async (patientId: string) => {
    const response = await api.get(`/patient-care/pain-map/patient/${patientId}/statistics`);
    return response.data;
  },

  getTrend: async (patientId: string, days?: number) => {
    const response = await api.get(`/patient-care/pain-map/patient/${patientId}/trend`, {
      params: { days },
    });
    return response.data;
  },

  deleteMarker: async (markerId: string) => {
    const response = await api.delete(`/patient-care/pain-map/marker/${markerId}`);
    return response.data;
  },
};

// ============================================================
// P5: PHOTO PROGRESS
// ============================================================

export const photoProgressApi = {
  upload: async (
    patientId: string,
    file: File,
    photoData: {
      photoDate: string;
      photoType: 'before' | 'during' | 'after';
      bodyPart?: string;
      notes?: string;
    }
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    formData.append('photoDate', photoData.photoDate);
    formData.append('photoType', photoData.photoType);
    if (photoData.bodyPart) formData.append('bodyPart', photoData.bodyPart);
    if (photoData.notes) formData.append('notes', photoData.notes);
    
    const response = await api.post('/patient-care/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getTimeline: async (patientId: string) => {
    const response = await api.get(`/patient-care/photos/patient/${patientId}/timeline`);
    return response.data;
  },

  getPhoto: async (photoId: string) => {
    const response = await api.get(`/patient-care/photos/${photoId}`);
    return response.data;
  },

  comparePhotos: async (patientId: string, beforeId: string, afterId: string) => {
    const response = await api.get('/patient-care/photos/compare', {
      params: {
        patientId,
        beforeId,
        afterId,
      },
    });
    return response.data;
  },

  deletePhoto: async (photoId: string) => {
    const response = await api.delete(`/patient-care/photos/${photoId}`);
    return response.data;
  },

  getStatistics: async (patientId: string) => {
    const response = await api.get(`/patient-care/photos/patient/${patientId}/statistics`);
    return response.data;
  },
};
