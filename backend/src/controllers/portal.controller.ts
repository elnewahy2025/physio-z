import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { checkTherapistConcurrency, checkGlobalConcurrency } from '../services/appointment.service.js';

export const getAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.patientId;

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
      },
      include: {
        therapist: {
          select: { id: true, name: true, role: true },
        },
        patient: {
          select: { id: true, name: true, phone: true },
        }
      },
      orderBy: {
        dateTime: 'desc',
      },
    });

    res.json({ data: appointments, pagination: { total: appointments.length } });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Date is required' });
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        dateTime: { gte: start, lte: end },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      select: {
        dateTime: true,
        duration: true,
        therapistId: true
      }
    });

    const settings = await prisma.settings.findFirst();

    res.json({
      data: appointments,
      maxConcurrentRooms: settings?.maxConcurrentRooms ?? 5
    });
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.patientId!;
    const { therapistId, dateTime, duration = 45 } = req.body;

    // Check if therapist exists and is active
    const therapist = await prisma.user.findFirst({
      where: {
        id: therapistId,
        role: 'THERAPIST',
        isActive: true,
      },
    });

    if (!therapist) {
      return res.status(400).json({ message: 'Invalid or inactive therapist' });
    }

    const requestedDateTime = new Date(dateTime);

    // Enforce max 2 appointments per therapist per slot using the exact same overlap logic as staff
    await checkTherapistConcurrency(therapistId, requestedDateTime, duration);

    // Enforce global room capacity (R)
    await checkGlobalConcurrency(requestedDateTime, duration);

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        therapistId,
        dateTime: new Date(dateTime),
        duration,
        status: 'PENDING',
      },
      include: {
        therapist: {
          select: { id: true, name: true },
        },
        patient: {
          select: { id: true, name: true, phone: true },
        }
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

export const getTherapists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const therapists = await prisma.user.findMany({
      where: {
        role: 'THERAPIST',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
    // The frontend expects array directly for users route, or data wrapper.
    // Let's wrap in `data` or send directly. Let's send directly since we'll build a custom hook.
    res.json(therapists);
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const patientId = req.patientId;

    const invoices = await prisma.invoice.findMany({
      where: {
        patientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ data: invoices, pagination: { total: invoices.length } });
  } catch (error) {
    next(error);
  }
};
