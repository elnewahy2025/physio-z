import api from '../../../services/api';

export const treatmentEffectivenessService = {
  async getTreatmentEffectiveness(filters?: {
    diagnosis?: string;
    therapistId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const response = await api.get('/intelligence/treatment-effectiveness', {
      params: filters,
    });
    return response.data;
  },

  async getTherapistEffectiveness(therapistId: string) {
    const response = await api.get(`/intelligence/treatment-effectiveness/therapist/${therapistId}`);
    return response.data;
  },
};
