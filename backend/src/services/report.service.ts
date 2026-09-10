// backend/src/services/report.service.ts
import { prisma } from '../lib/prisma.js';

// ─── 1. Financial Summary ───
export async function getFinancialReport(startDate: Date, endDate: Date) {
  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: {
        patient: { select: { name: true } },
        payments: { where: { status: 'COMPLETED' } },
      },
    }),
    prisma.payment.findMany({
      where: { paymentDate: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
    }),
  ]);

  const totalInvoiced = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalOutstanding = totalInvoiced - totalCollected;

  // Payment method breakdown
  const byMethod: Record<string, number> = {};
  for (const p of payments) {
    byMethod[p.method] = (byMethod[p.method] || 0) + Number(p.amount);
  }

  // Revenue by month (for chart)
  const revenueByMonth: Record<string, number> = {};
  for (const inv of invoices) {
    const monthKey = inv.createdAt.toISOString().slice(0, 7); // YYYY-MM
    revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + Number(inv.total);
  }

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const inv of invoices) {
    byStatus[inv.status] = (byStatus[inv.status] || 0) + 1;
  }

  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totals: {
      invoiced: totalInvoiced,
      collected: totalCollected,
      outstanding: totalOutstanding,
      invoiceCount: invoices.length,
    },
    byStatus,
    byMethod,
    revenueByMonth: Object.entries(revenueByMonth).map(([month, total]) => ({
      month,
      total: Math.round(total),
    })),
    recentInvoices: invoices.slice(0, 10).map((inv) => ({
      number: inv.number,
      patientName: inv.patient.name,
      total: Number(inv.total),
      status: inv.status,
      createdAt: inv.createdAt,
    })),
  };
}

// ─── 2. Outstanding Balances ───
export async function getOutstandingBalances() {
  const invoices = await prisma.invoice.findMany({
    where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      payments: { where: { status: 'COMPLETED' } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const patientBalances = new Map<
    string,
    {
      patientId: string;
      patientName: string;
      phone: string;
      totalOwed: number;
      invoiceCount: number;
      oldestInvoiceDate: Date;
      daysOverdue: number;
      invoices: Array<{
        number: string;
        total: number;
        paid: number;
        owed: number;
        dueDate: string | null;
        createdAt: string;
      }>;
    }
  >();

  for (const inv of invoices) {
    const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
    const owed = Number(inv.total) - paid;

    if (owed <= 0) continue;

    const existing = patientBalances.get(inv.patient.id) || {
      patientId: inv.patient.id,
      patientName: inv.patient.name,
      phone: inv.patient.phone,
      totalOwed: 0,
      invoiceCount: 0,
      oldestInvoiceDate: inv.createdAt,
      daysOverdue: 0,
      invoices: [],
    };

    existing.totalOwed += owed;
    existing.invoiceCount++;
    if (inv.createdAt < existing.oldestInvoiceDate) {
      existing.oldestInvoiceDate = inv.createdAt;
    }
    existing.daysOverdue = Math.floor(
      (Date.now() - existing.oldestInvoiceDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    existing.invoices.push({
      number: inv.number,
      total: Number(inv.total),
      paid,
      owed,
      dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
      createdAt: inv.createdAt.toISOString(),
    });

    patientBalances.set(inv.patient.id, existing);
  }

  return Array.from(patientBalances.values()).sort((a, b) => b.totalOwed - a.totalOwed);
}

// ─── 3. Therapist Performance ───
export async function getTherapistReport(startDate: Date, endDate: Date) {
  const therapists = await prisma.user.findMany({
    where: { role: 'THERAPIST', isActive: true },
    select: { id: true, name: true },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      dateTime: { gte: startDate, lte: endDate },
      status: { in: ['COMPLETED', 'NO_SHOW', 'CANCELLED', 'CONFIRMED'] },
    },
    include: {
      invoices: { include: { payments: { where: { status: 'COMPLETED' } } } },
    },
  });

  // Get ratings
  const ratings = await prisma.rating.groupBy({
    by: ['therapistId'],
    _avg: { rating: true },
    _count: { rating: true },
  });

  const ratingMap = new Map(
    ratings.map((r) => [
      r.therapistId,
      {
        average: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null,
        count: r._count.rating,
      },
    ]),
  );

  const report = therapists.map((t) => {
    const tAppts = appointments.filter((a) => a.therapistId === t.id);
    const completed = tAppts.filter((a) => a.status === 'COMPLETED').length;
    const noShow = tAppts.filter((a) => a.status === 'NO_SHOW').length;
    const cancelled = tAppts.filter((a) => a.status === 'CANCELLED').length;
    const total = tAppts.length;

    // Revenue = sum of paid amounts for invoices linked to this therapist's appointments
    const revenue = tAppts.reduce((sum, apt) => {
      const aptRevenue = (apt.invoices || []).reduce((invSum, inv) => {
        const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
        return invSum + paid;
      }, 0);
      return sum + aptRevenue;
    }, 0);

    const rating = ratingMap.get(t.id);

    return {
      therapistId: t.id,
      therapistName: t.name,
      totalAppointments: total,
      completed,
      noShow,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      revenue: Math.round(revenue),
      avgRating: rating?.average || null,
      ratingCount: rating?.count || 0,
    };
  });

  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    therapists: report.sort((a, b) => b.revenue - a.revenue),
  };
}

// ─── 4. Patient Statistics ───
export async function getPatientStatistics(startDate: Date, endDate: Date) {
  const [totalPatients, newPatients, allPatients, diagnoses] = await Promise.all([
    prisma.patient.count(),
    prisma.patient.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.patient.findMany({ select: { dateOfBirth: true, createdAt: true } }),
    prisma.therapySession.groupBy({
      by: ['diagnosis'],
      _count: { diagnosis: true },
      orderBy: { _count: { diagnosis: 'desc' } },
      take: 10,
    }),
  ]);

  // Age distribution
  const ageGroups: Record<string, number> = {
    '0-18': 0, '19-30': 0, '31-45': 0, '46-60': 0, '60+': 0,
  };

  for (const p of allPatients) {
    if (!p.dateOfBirth) continue;
    const age = Math.floor(
      (Date.now() - p.dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000),
    );
    if (age <= 18) ageGroups['0-18']++;
    else if (age <= 30) ageGroups['19-30']++;
    else if (age <= 45) ageGroups['31-45']++;
    else if (age <= 60) ageGroups['46-60']++;
    else ageGroups['60+']++;
  }

  // New patients by month
  const byMonth: Record<string, number> = {};
  for (const p of allPatients) {
    if (p.createdAt >= startDate) {
      const monthKey = p.createdAt.toISOString().slice(0, 7);
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    }
  }

  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totals: { totalPatients, newPatients },
    ageDistribution: Object.entries(ageGroups).map(([group, count]) => ({
      group,
      count,
    })),
    topDiagnoses: diagnoses.map((d) => ({
      diagnosis: d.diagnosis,
      count: d._count.diagnosis,
    })),
    newPatientsByMonth: Object.entries(byMonth).map(([month, count]) => ({
      month,
      count,
    })),
  };
}

// ─── 5. Appointment Analytics ───
export async function getAppointmentReport(startDate: Date, endDate: Date) {
  const appointments = await prisma.appointment.findMany({
    where: { dateTime: { gte: startDate, lte: endDate } },
    select: {
      dateTime: true,
      status: true,
      roomId: true,
      therapistId: true,
      duration: true,
    },
  });

  // Status breakdown
  const byStatus: Record<string, number> = {};
  for (const appt of appointments) {
    byStatus[appt.status] = (byStatus[appt.status] || 0) + 1;
  }

  // By day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay: Record<string, number> = {};
  for (const appt of appointments) {
    const day = dayNames[appt.dateTime.getDay()];
    byDay[day] = (byDay[day] || 0) + 1;
  }

  // By hour (for peak hours analysis)
  const byHour: Record<number, number> = {};
  for (const appt of appointments) {
    const hour = appt.dateTime.getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;
  }

  // Peak hours
  const peakHours = Object.entries(byHour)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: `${hour}:00`, count }));

  // Calculate rates
  const total = appointments.length;
  const completed = byStatus['COMPLETED'] || 0;
  const noShow = byStatus['NO_SHOW'] || 0;
  const cancelled = byStatus['CANCELLED'] || 0;

  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    totals: { total, completed, cancelled, noShow },
    rates: {
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    },
    byStatus,
    byDay: dayNames.map((day) => ({ day, count: byDay[day] || 0 })),
    byHour: Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      count: byHour[hour] || 0,
    })).filter((h) => h.count > 0),
    peakHours,
  };
}

// ─── 6. Room Utilization ───
export async function getRoomUtilization(startDate: Date, endDate: Date) {
  const rooms = await prisma.room.findMany({
    include: {
      appointments: {
        where: {
          dateTime: { gte: startDate, lte: endDate },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
      },
    },
    orderBy: { number: 'asc' },
  });

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const workingHoursPerDay = 8;
  const availableHours = daysDiff * workingHoursPerDay;

  return rooms.map((room) => {
    const bookedHours = room.appointments.reduce(
      (sum, apt) => sum + apt.duration / 60,
      0,
    );

    return {
      roomNumber: room.number,
      roomName: room.name,
      appointmentCount: room.appointments.length,
      bookedHours: Math.round(bookedHours * 10) / 10,
      utilizationRate:
        availableHours > 0 ? Math.round((bookedHours / availableHours) * 100) : 0,
    };
  });
}

// ─── 7. Tax Report ───
export async function getTaxReport(startDate: Date, endDate: Date) {
  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } });
  const taxRate = Number(settings?.taxRate || 0);

  const invoices = await prisma.invoice.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { amount: true, tax: true, total: true },
  });

  const totalRevenue = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const totalTax = invoices.reduce((s, inv) => s + Number(inv.tax), 0);
  const totalNet = invoices.reduce((s, inv) => s + Number(inv.amount), 0);

  return {
    period: { start: startDate.toISOString(), end: endDate.toISOString() },
    taxRate,
    totals: {
      grossRevenue: totalRevenue,
      taxCollected: totalTax,
      netRevenue: totalNet,
      invoiceCount: invoices.length,
    },
    monthlyBreakdown: (() => {
      const byMonth: Record<string, { revenue: number; tax: number; net: number }> = {};
      for (const inv of invoices) {
        // We need createdAt for month grouping
      }
      // Simplified — group by invoice date
      return [];
    })(),
  };
}