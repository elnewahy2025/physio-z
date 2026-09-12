import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { Prisma } from '@prisma/client';

export interface CreateProviderDto {
  name: string;
  nameAr: string;
  code: string;
  contactEmail?: string;
  contactPhone?: string;
  portalUrl?: string;
  claimSubmissionType?: string;
  defaultCopayPct?: number;
  payerId?: string;
  isActive?: boolean;
}

export interface CreatePolicyDto {
  patientId: string;
  providerId: string;
  policyNumber: string;
  memberId?: string;
  coveragePercentage?: number;
  copayFixedAmount?: number;
  annualMaxLimit?: number;
  preAuthRequired?: boolean;
  validFrom?: string | Date;
  validTo: string | Date;
  notes?: string;
}

export interface CreateClaimDto {
  patientId: string;
  providerId: string;
  policyId?: string;
  appointmentId?: string;
  invoiceId?: string;
  serviceDate?: string | Date;
  diagnosisCode?: string;
  treatmentDescription: string;
  totalAmount: number;
  coveredAmount?: number;
  patientCopayAmount?: number;
  status?: string; // DRAFT, PRE_AUTH_PENDING, SUBMITTED, APPROVED, REJECTED, PAID
  preAuthCode?: string;
  notes?: string;
}

const DEFAULT_PROVIDERS: CreateProviderDto[] = [
  {
    name: 'AXA Health Insurance Egypt',
    nameAr: 'أكسا للتأمين الطبي - مصر',
    code: 'AXA_EG',
    contactEmail: 'claims@axa-onehealth.com',
    contactPhone: '+20 2 16363',
    portalUrl: 'https://axa.eg/portal',
    claimSubmissionType: 'PORTAL',
    defaultCopayPct: 20,
    payerId: 'PAYER_AXA_01',
    isActive: true,
  },
  {
    name: 'Bupa Global & Egypt',
    nameAr: 'بوبا للخدمات الصحية والتأمين',
    code: 'BUPA_EG',
    contactEmail: 'egyptclaims@bupa.com',
    contactPhone: '+20 2 24003000',
    portalUrl: 'https://members.bupaglobal.com',
    claimSubmissionType: 'PORTAL',
    defaultCopayPct: 15,
    payerId: 'PAYER_BUPA_02',
    isActive: true,
  },
  {
    name: 'MetLife Alico',
    nameAr: 'ميتلايف أليكو لتأمينات الحياة والرعاية الصحية',
    code: 'METLIFE_EG',
    contactEmail: 'medical.claims@metlife.com.eg',
    contactPhone: '+20 2 19783',
    portalUrl: 'https://e-services.metlifeegypt.com',
    claimSubmissionType: 'PORTAL',
    defaultCopayPct: 20,
    payerId: 'PAYER_MET_03',
    isActive: true,
  },
  {
    name: 'GlobeMed Egypt TPA',
    nameAr: 'جلوب ميد مصر لإدارة الرعاية الطبية',
    code: 'GLOBEMED_EG',
    contactEmail: 'approvals@globemedegypt.com',
    contactPhone: '+20 2 19688',
    portalUrl: 'https://globemedegypt.com/portal',
    claimSubmissionType: 'PORTAL',
    defaultCopayPct: 20,
    payerId: 'PAYER_GLOBE_04',
    isActive: true,
  },
  {
    name: 'Nextcare Egypt',
    nameAr: 'نكست كير لإدارة المطالبات الصحية',
    code: 'NEXTCARE_EG',
    contactEmail: 'preauth@nextcarehealth.com',
    contactPhone: '+20 2 27680000',
    portalUrl: 'https://nextcarehealth.com/providers',
    claimSubmissionType: 'PORTAL',
    defaultCopayPct: 25,
    payerId: 'PAYER_NEXT_05',
    isActive: true,
  },
  {
    name: 'Physical Therapy Syndicate Fund',
    nameAr: 'مشروع علاج نقابة العلاج الطبيعي',
    code: 'SYNDICATE_PT',
    contactEmail: 'syndicate.physio@gmail.com',
    contactPhone: '+20 2 23621458',
    portalUrl: '',
    claimSubmissionType: 'MANUAL',
    defaultCopayPct: 10,
    payerId: 'PAYER_SYND_06',
    isActive: true,
  },
  {
    name: 'Universal Health Insurance Authority (UHIA)',
    nameAr: 'الهيئة العامة للتأمين الصحي الشامل',
    code: 'UHIA_GOV',
    contactEmail: 'support@uhia.gov.eg',
    contactPhone: '15344',
    portalUrl: 'https://uhia.gov.eg',
    claimSubmissionType: 'API',
    defaultCopayPct: 10,
    payerId: 'PAYER_UHIA_07',
    isActive: true,
  },
];

// Seed default providers if none exist
export async function seedProvidersIfEmpty() {
  const count = await prisma.insuranceProvider.count();
  if (count === 0) {
    for (const provider of DEFAULT_PROVIDERS) {
      await prisma.insuranceProvider.create({
        data: {
          name: provider.name,
          nameAr: provider.nameAr,
          code: provider.code,
          contactEmail: provider.contactEmail,
          contactPhone: provider.contactPhone,
          portalUrl: provider.portalUrl,
          claimSubmissionType: provider.claimSubmissionType || 'PORTAL',
          defaultCopayPct: new Prisma.Decimal(provider.defaultCopayPct ?? 20),
          payerId: provider.payerId,
          isActive: provider.isActive ?? true,
        },
      });
    }
  }
}

// ---------------- PROVIDERS ----------------
export async function listProviders(activeOnly = false) {
  await seedProvidersIfEmpty();
  return prisma.insuranceProvider.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          policies: true,
          claims: true,
        },
      },
    },
  });
}

export async function createProvider(dto: CreateProviderDto) {
  const existing = await prisma.insuranceProvider.findUnique({
    where: { code: dto.code.trim().toUpperCase() },
  });
  if (existing) {
    throw new HttpError(400, `Insurance provider with code ${dto.code} already exists`);
  }

  return prisma.insuranceProvider.create({
    data: {
      name: dto.name,
      nameAr: dto.nameAr,
      code: dto.code.trim().toUpperCase(),
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      portalUrl: dto.portalUrl,
      claimSubmissionType: dto.claimSubmissionType || 'PORTAL',
      defaultCopayPct: new Prisma.Decimal(dto.defaultCopayPct ?? 20),
      payerId: dto.payerId,
      isActive: dto.isActive ?? true,
    },
  });
}

export async function updateProvider(id: string, dto: Partial<CreateProviderDto>) {
  return prisma.insuranceProvider.update({
    where: { id },
    data: {
      name: dto.name,
      nameAr: dto.nameAr,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      portalUrl: dto.portalUrl,
      claimSubmissionType: dto.claimSubmissionType,
      defaultCopayPct: dto.defaultCopayPct !== undefined ? new Prisma.Decimal(dto.defaultCopayPct) : undefined,
      payerId: dto.payerId,
      isActive: dto.isActive,
    },
  });
}

export async function deleteProvider(id: string) {
  return prisma.insuranceProvider.delete({
    where: { id },
  });
}

// ---------------- PATIENT POLICIES ----------------
export async function getPatientPolicies(patientId: string) {
  return prisma.patientInsurancePolicy.findMany({
    where: { patientId },
    include: {
      provider: true,
    },
    orderBy: { validTo: 'desc' },
  });
}

export async function createPatientPolicy(dto: CreatePolicyDto) {
  return prisma.patientInsurancePolicy.create({
    data: {
      patientId: dto.patientId,
      providerId: dto.providerId,
      policyNumber: dto.policyNumber,
      memberId: dto.memberId,
      coveragePercentage: new Prisma.Decimal(dto.coveragePercentage ?? 80),
      copayFixedAmount: new Prisma.Decimal(dto.copayFixedAmount ?? 0),
      annualMaxLimit: dto.annualMaxLimit !== undefined ? new Prisma.Decimal(dto.annualMaxLimit) : undefined,
      preAuthRequired: dto.preAuthRequired ?? false,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
      validTo: new Date(dto.validTo),
      notes: dto.notes,
    },
    include: {
      provider: true,
    },
  });
}

export async function updatePatientPolicy(id: string, dto: Partial<CreatePolicyDto>) {
  return prisma.patientInsurancePolicy.update({
    where: { id },
    data: {
      policyNumber: dto.policyNumber,
      memberId: dto.memberId,
      coveragePercentage: dto.coveragePercentage !== undefined ? new Prisma.Decimal(dto.coveragePercentage) : undefined,
      copayFixedAmount: dto.copayFixedAmount !== undefined ? new Prisma.Decimal(dto.copayFixedAmount) : undefined,
      annualMaxLimit: dto.annualMaxLimit !== undefined ? new Prisma.Decimal(dto.annualMaxLimit) : undefined,
      preAuthRequired: dto.preAuthRequired,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      notes: dto.notes,
    },
    include: {
      provider: true,
    },
  });
}

// ---------------- CLAIMS ----------------
export async function listClaims(filters: {
  status?: string;
  providerId?: string;
  patientId?: string;
  search?: string;
}) {
  const where: Prisma.InsuranceClaimWhereInput = {};

  if (filters.status && filters.status !== 'ALL') {
    where.status = filters.status;
  }
  if (filters.providerId) {
    where.providerId = filters.providerId;
  }
  if (filters.patientId) {
    where.patientId = filters.patientId;
  }
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { claimNumber: { contains: q, mode: 'insensitive' } },
      { treatmentDescription: { contains: q, mode: 'insensitive' } },
      { diagnosisCode: { contains: q, mode: 'insensitive' } },
      { preAuthCode: { contains: q, mode: 'insensitive' } },
      { patient: { name: { contains: q, mode: 'insensitive' } } },
      { patient: { phone: { contains: q, mode: 'insensitive' } } },
      { provider: { name: { contains: q, mode: 'insensitive' } } },
      { provider: { nameAr: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const claims = await prisma.insuranceClaim.findMany({
    where,
    include: {
      patient: {
        select: { id: true, name: true, phone: true },
      },
      provider: true,
      policy: true,
      appointment: {
        select: { id: true, dateTime: true, status: true },
      },
      invoice: {
        select: { id: true, number: true, status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return claims;
}

export async function getClaimById(id: string) {
  const claim = await prisma.insuranceClaim.findUnique({
    where: { id },
    include: {
      patient: true,
      provider: true,
      policy: true,
      appointment: true,
      invoice: true,
    },
  });
  if (!claim) {
    throw new HttpError(404, 'Claim not found');
  }
  return claim;
}

export async function createClaim(dto: CreateClaimDto) {
  // Generate claim number
  const today = new Date();
  const yearMonth = today.toISOString().slice(0, 7).replace('-', '');
  const count = await prisma.insuranceClaim.count();
  const claimNumber = `CLM-${yearMonth}-${String(count + 1).padStart(4, '0')}`;

  // Calculate split if not provided
  let coveredAmount = dto.coveredAmount;
  let patientCopayAmount = dto.patientCopayAmount;

  if (coveredAmount === undefined || patientCopayAmount === undefined) {
    let copayPct = 20; // Default 20%
    if (dto.policyId) {
      const policy = await prisma.patientInsurancePolicy.findUnique({
        where: { id: dto.policyId },
      });
      if (policy) {
        const coveragePct = Number(policy.coveragePercentage);
        copayPct = 100 - coveragePct;
      }
    } else {
      const provider = await prisma.insuranceProvider.findUnique({
        where: { id: dto.providerId },
      });
      if (provider) {
        copayPct = Number(provider.defaultCopayPct);
      }
    }

    patientCopayAmount = Math.round((dto.totalAmount * (copayPct / 100)) * 100) / 100;
    coveredAmount = Math.round((dto.totalAmount - patientCopayAmount) * 100) / 100;
  }

  return prisma.insuranceClaim.create({
    data: {
      claimNumber,
      patientId: dto.patientId,
      providerId: dto.providerId,
      policyId: dto.policyId,
      appointmentId: dto.appointmentId,
      invoiceId: dto.invoiceId,
      serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : new Date(),
      diagnosisCode: dto.diagnosisCode,
      treatmentDescription: dto.treatmentDescription,
      totalAmount: new Prisma.Decimal(dto.totalAmount),
      coveredAmount: new Prisma.Decimal(coveredAmount),
      patientCopayAmount: new Prisma.Decimal(patientCopayAmount),
      status: dto.status || 'SUBMITTED',
      preAuthCode: dto.preAuthCode,
      notes: dto.notes,
    },
    include: {
      patient: true,
      provider: true,
      policy: true,
    },
  });
}

export async function updateClaimStatus(
  id: string,
  data: {
    status: string;
    preAuthCode?: string;
    rejectionReason?: string;
    notes?: string;
  }
) {
  const updateData: Prisma.InsuranceClaimUpdateInput = {
    status: data.status,
    notes: data.notes,
  };

  if (data.preAuthCode !== undefined) {
    updateData.preAuthCode = data.preAuthCode;
  }
  if (data.rejectionReason !== undefined) {
    updateData.rejectionReason = data.rejectionReason;
  }

  if (data.status === 'APPROVED') {
    updateData.approvedAt = new Date();
  } else if (data.status === 'PAID') {
    updateData.paidAt = new Date();
  }

  return prisma.insuranceClaim.update({
    where: { id },
    data: updateData,
    include: {
      patient: true,
      provider: true,
      policy: true,
    },
  });
}

// ---------------- CALCULATOR & STATS ----------------
export async function calculateCoverage(data: {
  amount: number;
  providerId?: string;
  policyId?: string;
}) {
  let coveragePct = 80;
  let copayFixed = 0;

  if (data.policyId) {
    const policy = await prisma.patientInsurancePolicy.findUnique({
      where: { id: data.policyId },
      include: { provider: true },
    });
    if (policy) {
      coveragePct = Number(policy.coveragePercentage);
      copayFixed = Number(policy.copayFixedAmount);
    }
  } else if (data.providerId) {
    const provider = await prisma.insuranceProvider.findUnique({
      where: { id: data.providerId },
    });
    if (provider) {
      const copayPct = Number(provider.defaultCopayPct);
      coveragePct = 100 - copayPct;
    }
  }

  const patientPercentageCost = (data.amount * (100 - coveragePct)) / 100;
  const totalPatientCopay = Math.min(data.amount, patientPercentageCost + copayFixed);
  const coveredAmount = Math.max(0, data.amount - totalPatientCopay);

  return {
    totalAmount: data.amount,
    coveragePercentage: coveragePct,
    copayPercentage: 100 - coveragePct,
    copayFixedAmount: copayFixed,
    patientCopay: Math.round(totalPatientCopay * 100) / 100,
    coveredAmount: Math.round(coveredAmount * 100) / 100,
  };
}

export async function getInsuranceStats() {
  const [totalClaims, claimsList] = await Promise.all([
    prisma.insuranceClaim.count(),
    prisma.insuranceClaim.findMany({
      select: {
        status: true,
        totalAmount: true,
        coveredAmount: true,
        patientCopayAmount: true,
      },
    }),
  ]);

  let totalBilled = 0;
  let totalCovered = 0;
  let totalCopay = 0;
  let pendingPreAuthCount = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  for (const c of claimsList) {
    totalBilled += Number(c.totalAmount);
    totalCovered += Number(c.coveredAmount);
    totalCopay += Number(c.patientCopayAmount);

    if (c.status === 'PRE_AUTH_PENDING') pendingPreAuthCount++;
    if (c.status === 'APPROVED' || c.status === 'PAID') approvedCount++;
    if (c.status === 'REJECTED') rejectedCount++;
  }

  const resolved = approvedCount + rejectedCount;
  const rejectionRate = resolved > 0 ? Math.round((rejectedCount / resolved) * 100) : 0;

  return {
    totalClaims,
    totalBilled: Math.round(totalBilled),
    totalCovered: Math.round(totalCovered),
    totalCopay: Math.round(totalCopay),
    pendingPreAuthCount,
    approvedCount,
    rejectedCount,
    rejectionRate,
  };
}
