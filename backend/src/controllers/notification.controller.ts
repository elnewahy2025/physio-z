// backend/src/controllers/notification.controller.ts
import type { Request, Response } from 'react';
import { z } from 'zod';
import * as notificationService from '../services/notification.service.js';
import { notificationEmitter } from '../lib/notification-emitter.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new Error('Not authenticated');
  const { page, limit } = listQuerySchema.parse(req.query);
  res.json(await notificationService.listNotifications(req.userId, page, limit));
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new Error('Not authenticated');
  const result = await notificationService.markAsRead(req.userId, req.params.id);
  if (!result) {
    res.status(404).json({ message: 'Notification not found' });
    return;
  }
  res.json(result);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  if (!req.userId) throw new Error('Not authenticated');
  res.json(await notificationService.markAllAsRead(req.userId));
});

// ─── SSE Stream Endpoint ───
export const stream = (req: Request, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const userId = req.userId;

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  });
  res.flushHeaders();

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId })}\n\n`);

  // Heartbeat every 30 seconds (keeps connection alive)
  const heartbeat = setInterval(() => {
    res.write(`:heartbeat\n\n`);
  }, 30000);

  // Listen for new notifications for this user
  const listener = (notification: { userId: string }) => {
    if (notification.userId === userId) {
      res.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
  };

  notificationEmitter.on('notification', listener);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    notificationEmitter.off('notification', listener);
  });
};