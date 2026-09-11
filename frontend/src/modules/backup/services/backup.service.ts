import api from '../../../services/api';

export const backupService = {
  async createBackup(type?: 'FULL' | 'DATABASE_ONLY' | 'FILES_ONLY') {
    const response = await api.post('/backup/create', null, {
      params: { type },
    });
    return response.data;
  },

  async getBackupHistory() {
    const response = await api.get('/backup/history');
    return response.data;
  },

  async getBackupStatistics() {
    const response = await api.get('/backup/statistics');
    return response.data;
  },

  async downloadBackup(backupId: string) {
    const response = await api.get(`/backup/${backupId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async deleteBackup(backupId: string) {
    const response = await api.delete(`/backup/${backupId}`);
    return response.data;
  },
};
