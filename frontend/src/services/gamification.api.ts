import api from '../lib/api';

export interface GamificationProfile {
  id: string;
  points: number;
  currentStreak: number;
  longestStreak: number;
  tier: string;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteriaType: string;
  criteriaValue: number;
}

export const gamificationApi = {
  getProfile: async (patientId: string) => {
    const res = await api.get(`/gamification/${patientId}/profile`);
    return res.data as GamificationProfile;
  },
  
  getBadges: async () => {
    const res = await api.get('/gamification/badges');
    return res.data as Badge[];
  },
  
  logExercise: async (patientId: string, exerciseLogId: string) => {
    const res = await api.post(`/gamification/${patientId}/log-exercise`, { exerciseLogId });
    return res.data;
  }
};
