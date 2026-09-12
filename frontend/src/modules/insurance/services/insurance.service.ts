import api from '../../../lib/api';

export interface InsuranceProvider {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  contactEmail?: string;
  contactPhone?: string;
  portalUrl?: string;
  claimSubmissionType: 'PORTAL' | 'MANUAL' | 'API' | string;
  defaultCopayPct: number;
  payerId?: string;
  isActive: boolean;
  _count?: {
    policies: number;
    claims: number;
  };
}

export interface PatientInsurancePolicy {
  id: string;
  patientId: string;
  providerId: string;
  policyNumber: string;
  memberId?: string;
  coveragePercentage: number;
  copayFixedAmount: number;
  annualMaxLimit?: number;
  preAuthRequired: boolean;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  notes?: string;
  provider?: InsuranceProvider;
}

export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  patientId: string;
  providerId: string;
  policyId?: string;
  appointmentId?: string;
  invoiceId?: string;
  serviceDate: string;
  diagnosisCode?: string;
  treatmentDescription: string;
  totalAmount: number;
  coveredAmount: number;
  patientCopayAmount: number;
  status: 'DRAFT' | 'PRE_AUTH_PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
  preAuthCode?: string;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
  patient?: {
    id: string;
    name: string;
    phone: string;
  };
  provider?: InsuranceProvider;
  policy?: PatientInsurancePolicy;
}

export interface CoverageCalculation {
  totalAmount: number;
  coveragePercentage: number;
  copayPercentage: number;
  copayFixedAmount: number;
  patientCopay: number;
  coveredAmount: number;
}

export interface InsuranceStats {
  totalClaims: number;
  totalBilled: number;
  totalCovered: number;
  totalCopay: number;
  pendingPreAuthCount: number;
  approvedCount: number;
  rejectedCount: number;
  rejectionRate: number;
}

export const insuranceService = {
  // Providers
  async getProviders(activeOnly = false): Promise<InsuranceProvider[]> {
    const res = await api.get('/insurance/providers', { params: { active: activeOnly } });
    return res.data;
  },

  async createProvider(data: Partial<InsuranceProvider>): Promise<InsuranceProvider> {
    const res = await api.post('/insurance/providers', data);
    return res.data;
  },

  async updateProvider(id: string, data: Partial<InsuranceProvider>): Promise<InsuranceProvider> {
    const res = await api.put(`/insurance/providers/${id}`, data);
    return res.data;
  },

  async deleteProvider(id: string): Promise<{ id: string }> {
    const res = await api.delete(`/insurance/providers/${id}`);
    return res.data;
  },

  // Policies
  async getPatientPolicies(patientId: string): Promise<PatientInsurancePolicy[]> {
    const res = await api.get(`/insurance/policies/${patientId}`);
    return res.data;
  },

  async createPatientPolicy(patientId: string, data: Partial<PatientInsurancePolicy>): Promise<PatientInsurancePolicy> {
    const res = await api.post(`/insurance/policies/${patientId}`, data);
    return res.data;
  },

  // Claims
  async getClaims(params?: {
    status?: string;
    providerId?: string;
    patientId?: string;
    search?: string;
  }): Promise<InsuranceClaim[]> {
    const res = await api.get('/insurance/claims', { params });
    return res.data;
  },

  async getClaim(id: string): Promise<InsuranceClaim> {
    const res = await api.get(`/insurance/claims/${id}`);
    return res.data;
  },

  async createClaim(data: Partial<InsuranceClaim>): Promise<InsuranceClaim> {
    const res = await api.post('/insurance/claims', data);
    return res.data;
  },

  async updateClaimStatus(
    id: string,
    data: {
      status: string;
      preAuthCode?: string;
      rejectionReason?: string;
      notes?: string;
    }
  ): Promise<InsuranceClaim> {
    const res = await api.put(`/insurance/claims/${id}/status`, data);
    return res.data;
  },

  // Calculator & Stats
  async calculateCoverage(data: {
    amount: number;
    policyId?: string;
    providerId?: string;
  }): Promise<CoverageCalculation> {
    const res = await api.post('/insurance/calculate', data);
    return res.data;
  },

  async getStats(): Promise<InsuranceStats> {
    const res = await api.get('/insurance/stats');
    return res.data;
  },
};
