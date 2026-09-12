import api from '../../../lib/api';

export const consentFormsService = {
  async getConsentTemplates(type?: string) {
    const response = await api.get('/patient-care/consents/templates', {
      params: type ? { type } : {},
    });
    return response.data;
  },

  async getConsentTemplate(templateId: string) {
    const response = await api.get(`/patient-care/consents/templates/${templateId}`);
    return response.data;
  },

  async signConsent(data: {
    patientId: string;
    templateId: string;
    signatureData: string;
    witnessName?: string;
  }) {
    const response = await api.post('/patient-care/consents/sign', data);
    return response.data;
  },

  async getPatientConsents(patientId: string) {
    const response = await api.get(`/patient-care/consents/patient/${patientId}`);
    return response.data;
  },

  async getConsent(consentId: string) {
    const response = await api.get(`/patient-care/consents/${consentId}`);
    return response.data;
  },

  async verifyConsent(consentId: string) {
    const response = await api.get(`/patient-care/consents/${consentId}/verify`);
    return response.data;
  },
};
