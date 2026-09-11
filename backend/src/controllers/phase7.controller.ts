import { Request, Response } from 'express';
import * as auditService from '../services/audit.service';
import * as backupService from '../services/backup.service';

export const getLogs = async (req: Request, res: Response) => {
  const data = await auditService.getAuditLogs();
  res.json(data);
};
export const exportData = async (req: Request, res: Response) => {
  const data = await backupService.exportPatientData(req.params.patientId);
  res.json(data);
};
export const triggerBackup = async (req: Request, res: Response) => {
  const data = await backupService.triggerSystemBackup();
  res.json(data);
};
