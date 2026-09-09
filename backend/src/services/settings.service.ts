import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';

export interface UpdateSettingsData {
  centerName?: string;
  centerLogo?: string;
  address?: string;
  phone?: string;
  email?: string;
  googleMapsLink?: string;
  workingHours?: Record<string, unknown>;
  sessionPrice?: number;
  currency?: string;
  taxRate?: number;
  defaultLanguage?: string;
  whatsappMessageTemplate?: string;
}

export async function getSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!settings) throw new HttpError(500, 'Settings not configured. Run the database seed.');
  return settings;
}

export async function updateSettings(data: UpdateSettingsData) {
  const existing = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  if (!existing) throw new HttpError(500, 'Settings not configured');
  return prisma.settings.update({
    where: { id: 'singleton' },
    data: {
      ...(data.centerName !== undefined && { centerName: data.centerName }),
      ...(data.centerLogo !== undefined && { centerLogo: data.centerLogo }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.googleMapsLink !== undefined && { googleMapsLink: data.googleMapsLink }),
      ...(data.workingHours !== undefined && { workingHours: data.workingHours }),
      ...(data.sessionPrice !== undefined && { sessionPrice: data.sessionPrice }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
      ...(data.defaultLanguage !== undefined && { defaultLanguage: data.defaultLanguage }),
      ...(data.whatsappMessageTemplate !== undefined && { whatsappMessageTemplate: data.whatsappMessageTemplate }),
    },
  });
}