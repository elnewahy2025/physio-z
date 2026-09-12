import api from '../../../lib/api';

export interface TreatmentPhase {
  phaseNumber: number;
  title: string;
  titleAr: string;
  weeks: string;
  goals: string[];
  goalsAr: string[];
  modalities: string[];
  modalitiesAr: string[];
  precautions: string[];
  precautionsAr: string[];
  recommendedExercises: string[];
}

export interface TreatmentProtocol {
  id: string;
  title: string;
  titleAr: string;
  diagnosisCode?: string | null;
  bodyRegion: string;
  category: string;
  description: string;
  descriptionAr: string;
  phases: TreatmentPhase[];
  expectedDurationWeeks: number;
  evidenceSource: string;
  precautions: string[];
  successRatePct: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalTest {
  name: string;
  nameAr: string;
  purpose: string;
}

export interface DiagnosisSuggestion {
  diagnosis: string;
  diagnosisAr: string;
  icdCode: string;
  confidence: number;
  recommendedPhysicalTests: PhysicalTest[];
  redFlags: string[];
  suggestedProtocolId: string;
  protocolTitle: string;
  protocolTitleAr: string;
  rationale: string;
}

export interface OutcomePrediction {
  diagnosis: string;
  successProbability: number;
  totalEstimatedWeeks: number;
  painDropPct: number;
  milestones: Array<{ week: number; milestone: string }>;
  painTrajectory: Array<{ week: number; painLevel: number; description: string }>;
  clinicalRecommendations: string[];
}

export const clinicalDecisionService = {
  async getProtocols(filters?: { bodyRegion?: string; category?: string; search?: string }): Promise<TreatmentProtocol[]> {
    const res = await api.get('/clinical-decision/protocols', { params: filters });
    return res.data;
  },

  async getProtocolById(id: string): Promise<TreatmentProtocol> {
    const res = await api.get(`/clinical-decision/protocols/${id}`);
    return res.data;
  },

  async suggestDiagnosis(data: {
    bodyRegion: string;
    symptoms?: string;
    painType?: string;
    painIntensity?: number;
    age?: number;
  }): Promise<{ input: any; suggestions: DiagnosisSuggestion[] }> {
    const res = await api.post('/clinical-decision/suggest', data);
    return res.data;
  },

  async predictOutcome(data: {
    diagnosis: string;
    initialPain: number;
    age?: number;
    adherenceScore?: number;
    baselineMobility?: 'POOR' | 'MODERATE' | 'GOOD';
  }): Promise<OutcomePrediction> {
    const res = await api.post('/clinical-decision/outcome-prediction', data);
    return res.data;
  },
};
