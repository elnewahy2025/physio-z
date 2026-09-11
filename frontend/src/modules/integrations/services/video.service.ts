import api from '../../../services/api';

export const videoService = {
  async addVideoLink(
    appointmentId: string,
    data: {
      videoUrl: string;
      platform?: string;
      password?: string;
      notes?: string;
    }
  ) {
    const response = await api.post(`/integrations/video/appointment/${appointmentId}/link`, data);
    return response.data;
  },

  async getAppointmentVideoLinks(appointmentId: string) {
    const response = await api.get(`/integrations/video/appointment/${appointmentId}`);
    return response.data;
  },

  async getPatientVideoConsultations(patientId: string) {
    const response = await api.get(`/integrations/video/patient/${patientId}`);
    return response.data;
  },

  async deactivateVideoLink(videoId: string) {
    const response = await api.put(`/integrations/video/${videoId}/deactivate`);
    return response.data;
  },
};
