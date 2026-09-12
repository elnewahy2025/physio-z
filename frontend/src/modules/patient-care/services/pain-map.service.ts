import api from '../../../lib/api';

export const painMapService = {
  async addPainMarker(data: {
    patientId: string;
    bodyView: string;
    xCoordinate: number;
    yCoordinate: number;
    painIntensity: number;
    painType: string;
    painDescription?: string;
    appointmentId?: string;
  }) {
    const response = await api.post('/patient-care/pain-map/marker', data);
    return response.data;
  },

  async getPainHistory(
    patientId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const response = await api.get(`/patient-care/pain-map/patient/${patientId}/history`, {
      params: {
        dateFrom,
        dateTo,
      },
    });
    return response.data;
  },

  async getPainMapForAppointment(appointmentId: string) {
    const response = await api.get(`/patient-care/pain-map/appointment/${appointmentId}`);
    return response.data;
  },

  async getPainStatistics(patientId: string, dateFrom?: string, dateTo?: string) {
    const response = await api.get(`/patient-care/pain-map/patient/${patientId}/statistics`, {
      params: {
        dateFrom,
        dateTo,
      },
    });
    return response.data;
  },

  async deletePainMarker(markerId: string) {
    const response = await api.delete(`/patient-care/pain-map/marker/${markerId}`);
    return response.data;
  },
};
