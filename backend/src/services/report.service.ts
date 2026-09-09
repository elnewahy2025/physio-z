import { prisma } from '../lib/prisma.js';

export async function getFinancialReport(startDate: Date, endDate: Date) {
  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { patient: { select: { name: true } }, payments: { where: { status: 'COMPLETED' } } },
    }),
    prisma.payment.findMany({
      where: { paymentDate: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
    }),
  ]);
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const byStatus = invoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});
  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totals: {
      invoiced: totalInvoiced, collected: totalCollected,
      outstanding: totalInvoiced - totalCollected, invoiceCount: invoices.length,
    },
    byStatus,
    recentInvoices: invoices.slice(0, 10).map((inv) => ({
      number: inv.number, patientName: inv.patient.name,
      total: Number(inv.total), status: inv.status, createdAt: inv.createdAt,
    })),
  };
}

export async function getAppointmentReport(startDate: Date, endDate: Date) {
  const appointments = await prisma.appointment.findMany({
    where: { dateTime: { gte: startDate, lte: endDate } },
    include: { therapist: { select: { id: true, name: true } } },
  });
  const byStatus = appointments.reduce<Record<string, number>>((acc, appt) => {
    acc[appt.status] = (acc[appt.status] || 0) + 1;
    return acc;
  }, {});
  const byDay = appointments.reduce<Record<string, number>>((acc, appt) => {
    const day = appt.dateTime.toISOString().split('T')[0];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totals: {
      total: appointments.length,
      completed: byStatus['COMPLETED'] || 0,
      cancelled: byStatus['CANCELLED'] || 0,
      noShow: byStatus['NO_SHOW'] || 0,
    },
    byStatus, byDay,
  };
}

export async function getTherapistReport(startDate: Date, endDate: Date) {
  const therapists = await prisma.user.findMany({
    where: { role: 'THERAPIST', isActive: true },
    select: { id: true, name: true },
  });
  const appointments = await prisma.appointment.findMany({
    where: { dateTime: { gte: startDate, lte: endDate }, status: { in: ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'CONFIRMED'] } },
    select: { therapistId: true, status: true },
  });
  const report = therapists.map((t) => {
    const tAppts = appointments.filter((a) => a.therapistId === t.id);
    const completed = tAppts.filter((a) => a.status === 'COMPLETED').length;
    const total = tAppts.length;
    return {
      therapistId: t.id, therapistName: t.name, totalAppointments: total,
      completed, noShow: tAppts.filter((a) => a.status === 'NO_SHOW').length,
      cancelled: tAppts.filter((a) => a.status === 'CANCELLED').length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });
  return { period: { start: startDate.toISOString(), end: endDate.toISOString() }, therapists: report };
}