import api from '../../../lib/api';

export const photoProgressService = {
  async uploadPhoto(formData: FormData) {
    const response = await api.post('/patient-care/photos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getPhotoTimeline(patientId: string) {
    const response = await api.get(`/patient-care/photos/patient/${patientId}/timeline`);
    return response.data;
  },

  async getPhoto(photoId: string) {
    const response = await api.get(`/patient-care/photos/${photoId}`);
    return response.data;
  },

  async comparePhotos(patientId: string, beforeId: string, afterId: string) {
    const response = await api.get('/patient-care/photos/compare', {
      params: {
        patientId,
        beforeId,
        afterId,
      },
    });
    return response.data;
  },

  async deletePhoto(photoId: string) {
    const response = await api.delete(`/patient-care/photos/${photoId}`);
    return response.data;
  },
};
