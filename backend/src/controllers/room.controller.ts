import type { Request, Response } from 'express';
import * as roomService from '../services/room.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HttpError } from '../lib/errors.js';

export const list = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await roomService.listRooms());
});

export const availability = asyncHandler(async (req: Request, res: Response) => {
  const { date } = req.query;
  if (!date || typeof date !== 'string') {
    throw new HttpError(400, 'Date query parameter is required (YYYY-MM-DD)');
  }
  res.json(await roomService.getRoomAvailability(date));
});