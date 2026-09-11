import { Request, Response } from 'express';
import * as providerService from '../services/provider.service';

export const syncEvent = async (req: Request, res: Response) => {
  const result = await providerService.syncCalendar('system', req.body);
  res.json(result);
};

export const generateMeeting = async (req: Request, res: Response) => {
  const result = await providerService.createMeeting('system');
  res.json(result);
};
