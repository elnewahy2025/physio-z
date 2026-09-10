// backend/src/services/notification.service.ts
import { prisma } from '../lib/prisma.js';
import { notificationEmitter } from '../lib/notification-emitter.js';

export const NOTIFICATION_TYPES = {
  APPOINTMENT_BOOKED: 'APPOINTMENT_BOOKED',
  APPOINTMENT_CONFIRMED: 'APPOINTMENT_CONFIRMED',
  APPOINTMENT_CANCELLED: 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED: 'APPOINTMENT_COMPLETED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  INVOICE_CREATED: 'INVOICE_CREATED',
  PATIENT_REGISTERED: 'PATIENT_REGISTERED',
} as const;

export async function createNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? null,
    },
  });

  // Push to connected SSE clients
  notificationEmitter.emit('notification', notification);

  return notification;
}

export async function notifyRole(role: string, params: {
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const users = await prisma.user.findMany({
    where: { role, isActive: true },
    select: { id: true },
  });

  for (const user of users) {
    await createNotification({
      userId: user.id,
      ...params,
    });
  }
}

export async function listNotifications(userId: string, page: number, limit: number) {
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    data: notifications,
    unreadCount,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) return null;

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { success: true };
}