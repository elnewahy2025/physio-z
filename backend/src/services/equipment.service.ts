// backend/src/services/equipment.service.ts
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

const EQUIPMENT_CATEGORIES = ['TREATMENT', 'DIAGNOSTIC', 'EXERCISE', 'FURNITURE', 'OTHER'];
const MAINTENANCE_TYPES = ['ROUTINE', 'REPAIR', 'INSPECTION', 'CALIBRATION'];

export async function listEquipment(category?: string, status?: string) {
  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (status) where.status = status;
  else where.status = { not: 'RETIRED' };

  const equipment = await prisma.equipment.findMany({
    where,
    include: {
      room: { select: { number: true, name: true } },
      maintenanceLogs: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: { name: 'asc' },
  });

  // Calculate maintenance status
  return equipment.map((eq) => {
    const lastMaintenance = eq.maintenanceLogs[0];
    let maintenanceStatus = 'UNKNOWN';
    let daysSinceMaintenance: number | null = null;
    let daysUntilDue: number | null = null;

    if (eq.maintenanceIntervalDays) {
      const nextDue = lastMaintenance?.nextDueDate;
      if (nextDue) {
        daysUntilDue = Math.ceil(
          (nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        );
        if (daysUntilDue < 0) maintenanceStatus = 'OVERDUE';
        else if (daysUntilDue <= 7) maintenanceStatus = 'DUE_SOON';
        else maintenanceStatus = 'OK';
      }
    }

    if (lastMaintenance) {
      daysSinceMaintenance = Math.floor(
        (Date.now() - lastMaintenance.date.getTime()) / (1000 * 60 * 60 * 24),
      );
    }

    return {
      ...eq,
      maintenanceStatus,
      daysSinceMaintenance,
      daysUntilDue,
    };
  });
}

export async function createEquipment(data: {
  name: string;
  category: string;
  serialNumber?: string;
  roomId?: string;
  purchaseDate?: Date;
  purchaseCost?: number;
  maintenanceIntervalDays?: number;
  notes?: string;
}) {
  if (!EQUIPMENT_CATEGORIES.includes(data.category)) {
    throw new HttpError(400, `Category must be one of: ${EQUIPMENT_CATEGORIES.join(', ')}`);
  }

  return prisma.equipment.create({ data });
}

export async function updateEquipment(id: string, data: Partial<{
  name: string;
  category: string;
  serialNumber: string;
  roomId: string;
  purchaseCost: number;
  maintenanceIntervalDays: number;
  status: string;
  notes: string;
}>) {
  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Equipment not found');

  return prisma.equipment.update({ where: { id }, data });
}

export async function deleteEquipment(id: string) {
  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Equipment not found');
  await prisma.equipment.update({ where: { id }, data: { status: 'RETIRED' } });
  return { success: true };
}

// ─── Maintenance Logs ───

export async function logMaintenance(data: {
  equipmentId: string;
  type: string;
  description: string;
  cost?: number;
  performedBy?: string;
  nextDueInDays?: number;
  createdById: string;
}) {
  if (!MAINTENANCE_TYPES.includes(data.type)) {
    throw new HttpError(400, `Type must be one of: ${MAINTENANCE_TYPES.join(', ')}`);
  }

  const equipment = await prisma.equipment.findUnique({ where: { id: data.equipmentId } });
  if (!equipment) throw new HttpError(404, 'Equipment not found');

  // Calculate next due date
  const nextDueDate = data.nextDueInDays
    ? new Date(Date.now() + data.nextDueInDays * 24 * 60 * 60 * 1000)
    : equipment.maintenanceIntervalDays
      ? new Date(Date.now() + equipment.maintenanceIntervalDays * 24 * 60 * 60 * 1000)
      : null;

  const log = await prisma.maintenanceLog.create({
    data: {
      equipmentId: data.equipmentId,
      type: data.type,
      description: data.description,
      cost: data.cost ?? null,
      performedBy: data.performedBy ?? null,
      date: new Date(),
      nextDueDate,
      createdById: data.createdById,
    },
  });

  // Update equipment's last maintenance date
  await prisma.equipment.update({
    where: { id: data.equipmentId },
    data: { lastMaintenanceDate: new Date() },
  });

  return log;
}

export async function getMaintenanceHistory(equipmentId: string) {
  return prisma.maintenanceLog.findMany({
    where: { equipmentId },
    include: {
      createdBy: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getMaintenanceStats() {
  const equipment = await prisma.equipment.findMany({
    where: { status: { not: 'RETIRED' } },
    include: {
      maintenanceLogs: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  const totalEquipment = equipment.length;
  const overdueMaintenance = equipment.filter((eq) => {
    const lastLog = eq.maintenanceLogs[0];
    if (!lastLog?.nextDueDate) return false;
    return lastLog.nextDueDate < new Date();
  }).length;

  const dueSoon = equipment.filter((eq) => {
    const lastLog = eq.maintenanceLogs[0];
    if (!lastLog?.nextDueDate) return false;
    const days = Math.ceil(
      (lastLog.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days >= 0 && days <= 7;
  }).length;

  const totalMaintenanceCost = await prisma.maintenanceLog.aggregate({
    _sum: { cost: true },
  });

  return {
    totalEquipment,
    overdueMaintenance,
    dueSoon,
    underMaintenance: equipment.filter((e) => e.status === 'UNDER_MAINTENANCE').length,
    totalMaintenanceCost: totalMaintenanceCost._sum.cost
      ? Number(totalMaintenanceCost._sum.cost)
      : 0,
  };
}

// ─── Background Job: Check Maintenance Due ───
export async function checkMaintenanceDueJob() {
  const equipment = await prisma.equipment.findMany({
    where: { status: 'ACTIVE' },
    include: {
      maintenanceLogs: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
  });

  const overdue = equipment.filter((eq) => {
    const lastLog = eq.maintenanceLogs[0];
    if (!lastLog?.nextDueDate) return false;
    return lastLog.nextDueDate < new Date();
  });

  const dueSoon = equipment.filter((eq) => {
    const lastLog = eq.maintenanceLogs[0];
    if (!lastLog?.nextDueDate) return false;
    const days = Math.ceil(
      (lastLog.nextDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days >= 0 && days <= 7;
  });

  if (overdue.length > 0 || dueSoon.length > 0) {
    const owners = await prisma.user.findMany({
      where: { role: 'OWNER', isActive: true },
      select: { id: true },
    });

    for (const owner of owners) {
      let message = '';
      if (overdue.length > 0) {
        message += `${overdue.length} equipment overdue for maintenance. `;
      }
      if (dueSoon.length > 0) {
        message += `${dueSoon.length} equipment due within 7 days.`;
      }

      await prisma.notification.create({
        data: {
          userId: owner.id,
          type: 'MAINTENANCE_ALERT',
          title: 'Equipment Maintenance',
          message: message.trim(),
          link: '/equipment',
        },
      });
    }
  }

  return { overdue: overdue.length, dueSoon: dueSoon.length };
}