import api from '../../../lib/api';

export const exerciseService = {
  async getExercises(filters?: {
    category?: string;
    difficulty?: string;
    bodyPart?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get('/exercise-library/exercises', {
      params: filters,
    });
    return response.data;
  },

  async getExercise(exerciseId: string) {
    const response = await api.get(`/exercise-library/exercises/${exerciseId}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get('/exercise-library/exercises/categories');
    return response.data;
  },

  async getPopularExercises(limit?: number) {
    const response = await api.get('/exercise-library/exercises/popular', {
      params: { limit },
    });
    return response.data;
  },

  async searchExercises(query: string) {
    const response = await api.get('/exercise-library/exercises/search', {
      params: { q: query },
    });
    return response.data;
  },

  async createExercise(data: any) {
    const response = await api.post('/exercise-library/exercises', data);
    return response.data;
  },

  async updateExercise(exerciseId: string, data: any) {
    const response = await api.put(`/exercise-library/exercises/${exerciseId}`, data);
    return response.data;
  },

  async deleteExercise(exerciseId: string) {
    const response = await api.delete(`/exercise-library/exercises/${exerciseId}`);
    return response.data;
  },
};
