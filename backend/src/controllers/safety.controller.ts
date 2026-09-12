// backend/src/controllers/safety.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reportIncident = async (req: Request, res: Response) => {
  try {
    const { type, severity, description, relatedAppointmentId } = req.body;
    
    // We assume req.user is set by auth middleware
    const patientId = (req as any).user?.id; // Or however we determine who reported

    const incident = await prisma.incidentReport.create({
      data: {
        severity,
        description,
        reportedById: patientId,
        patientId: patientId,
      },
    });

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    console.error('[Safety Controller] Error reporting incident:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
