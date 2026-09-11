import api from '../../../services/api';

export const intakeFormsService = {
  async getFormTemplates(type?: string) {
    const response = await api.get('/patient-care/forms/templates', {
      params: type ? { type } : {},
    });
    return response.data;
  },

  async getFormTemplate(templateId: string) {
    const response = await api.get(`/patient-care/forms/templates/${templateId}`);
    return response.data;
  },

  async startForm(patientId: string, templateId: string) {
    const response = await api.post('/patient-care/forms/start', {
      patientId,
      templateId,
    });
    return response.data;
  },

  async saveFormProgress(formId: string, formData: any) {
    const response = await api.put(`/patient-care/forms/${formId}/progress`, {
      formData,
    });
    return response.data;
  },

  async submitForm(formId: string, formData: any) {
    const response = await api.put(`/patient-care/forms/${formId}/submit`, {
      formData,
    });
    return response.data;
  },

  async getPatientForms(patientId: string) {
    const response = await api.get(`/patient-care/forms/patient/${patientId}`);
    return response.data;
  },

  async getForm(formId: string) {
    const response = await api.get(`/patient-care/forms/${formId}`);
    return response.data;
  },
};
