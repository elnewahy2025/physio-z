import { Request, Response } from 'express';
import * as whatsappService from '../services/whatsapp.service';
import * as paymentService from '../services/payment.service';
import * as exerciseService from '../services/exercise.service';
import * as videoService from '../services/video.service';

export const getWhatsAppReminders = async (req: Request, res: Response) => {
  const data = await whatsappService.getReminders();
  res.json(data);
};
export const getInvoices = async (req: Request, res: Response) => {
  const data = await paymentService.getInvoices();
  res.json(data);
};
export const getExercises = async (req: Request, res: Response) => {
  const data = await exerciseService.getExercises();
  res.json(data);
};
export const generateMeeting = async (req: Request, res: Response) => {
  const data = await videoService.generateMeetingLink(req.params.id);
  res.json(data);
};
