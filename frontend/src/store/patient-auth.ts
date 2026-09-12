import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export interface PatientProfile {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  dateOfBirth: string | null;
}

interface PatientAuthState {
  token: string | null;
  patient: PatientProfile | null;
  setAuth: (token: string, patient: PatientProfile) => void;
  logout: () => void;
  updateProfile: (data: Partial<PatientProfile>) => void;
}

export const usePatientAuth = create<PatientAuthState>()(
  persist(
    (set) => ({
      token: null,
      patient: null,
      setAuth: (token, patient) => {
        set({ token, patient });
      },
      logout: () => {
        set({ token: null, patient: null });
      },
      updateProfile: (data) =>
        set((state) => ({
          patient: state.patient ? { ...state.patient, ...data } : null,
        })),
    }),
    {
      name: 'patient-auth-storage',
    }
  )
);
