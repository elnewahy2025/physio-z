import api from '../../../lib/api';

export const noShowPredictionService = {
  async predictNoShowRisk(appointmentId: string) {
    const response = await api.get(`/intelligence/no-show-prediction/appointment/${appointmentId}`);
    return response.data;
  },

  async getPatientRiskProfile(patientId: string) {
    const response = await api.get(`/intelligence/no-show-prediction/patient/${patientId}`);
    return response.data;
  },

  async getUpcomingAppointmentsRisk() {
    const response = await api.get('/intelligence/no-show-prediction/upcoming');
    return response.data;
  },
};
