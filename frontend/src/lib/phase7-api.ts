import api from './api';
export const phase7Api = {
  getAuditLogs: () => api.get('/phase7/audit-logs'),
  triggerBackup: () => api.post('/phase7/backup'),
  exportPatientData: (patientId: string) => api.get(`/phase7/export/patient/${patientId}`)
};
