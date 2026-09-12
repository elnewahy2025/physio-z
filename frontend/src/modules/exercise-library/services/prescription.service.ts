import api from '../../../lib/api';

export const prescriptionService = {
  async createPrescription(data: {
    patientId: string;
    appointmentId?: string;
    title: string;
    description?: string;
    instructions?: string;
    frequency?: string;
    duration?: string;
    exercises: Array<{
      exerciseId: string;
      sets?: number;
      reps?: number;
      holdTime?: number;
      restTime?: number;
      frequency?: string;
      notes?: string;
    }>;
  }) {
    const response = await api.post('/exercise-library/prescriptions', data);
    return response.data;
  },

  async getPrescription(prescriptionId: string) {
    const response = await api.get(`/exercise-library/prescriptions/${prescriptionId}`);
    return response.data;
  },

  async getPatientPrescriptions(
    patientId: string,
    status?: string,
    page?: number,
    limit?: number,
  ) {
    const response = await api.get('/exercise-library/prescriptions', {
      params: { patientId, status, page, limit },
    });
    return response.data;
  },

  async getTherapistPrescriptions(page?: number, limit?: number) {
    const response = await api.get('/exercise-library/prescriptions', {
      params: { page, limit },
    });
    return response.data;
  },

  async updatePrescription(prescriptionId: string, data: any) {
    const response = await api.put(`/exercise-library/prescriptions/${prescriptionId}`, data);
    return response.data;
  },

  async completePrescription(prescriptionId: string) {
    const response = await api.put(`/exercise-library/prescriptions/${prescriptionId}/complete`);
    return response.data;
  },

  async cancelPrescription(prescriptionId: string) {
    const response = await api.put(`/exercise-library/prescriptions/${prescriptionId}/cancel`);
    return response.data;
  },

  async logExerciseCompletion(data: {
    assignmentId: string;
    setsCompleted?: number;
    repsCompleted?: number;
    painLevel?: number;
    difficulty?: string;
    notes?: string;
  }) {
    const response = await api.post('/exercise-library/prescriptions/log', data);
    return response.data;
  },

  async getPatientExerciseHistory(patientId: string, days?: number) {
    const response = await api.get(`/exercise-library/prescriptions/patient/${patientId}/history`, {
      params: { days },
    });
    return response.data;
  },
};
