import { PrismaClient, AuditAction } from '@prisma/client';
const prisma = new PrismaClient();

export const logAction = async (userId: string, action: string, resource: string, details?: any) => {
  return prisma.auditLog.create({
    data: {
      userId,
      action: (action as AuditAction) || AuditAction.READ,
      entityType: resource || 'Unknown',
      description: details ? JSON.stringify(details) : 'No details',
      ipAddress: '127.0.0.1'
    }
  });
};

export const getAuditLogs = async () => {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });
};
