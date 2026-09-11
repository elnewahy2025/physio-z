import api from '../../../services/api';

export const medicalFileService = {
  async uploadMedicalFile(formData: FormData) {
    const response = await api.post('/patient-care/medical-files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getPatientFiles(patientId: string) {
    const response = await api.get(`/patient-care/medical-files/patient/${patientId}`);
    return response.data;
  },

  async downloadFile(fileId: string) {
    const response = await api.get(`/patient-care/medical-files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async deleteFile(fileId: string) {
    const response = await api.delete(`/patient-care/medical-files/${fileId}`);
    return response.data;
  },
};
