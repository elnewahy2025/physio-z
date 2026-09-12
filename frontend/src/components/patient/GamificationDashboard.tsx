import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Star, Award, Loader2 } from 'lucide-react';
import { gamificationApi, GamificationProfile } from '../../services/gamification.api';
import { useI18n } from '../../i18n';

export default function GamificationDashboard({ patientId }: { patientId: string }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['gamification', patientId],
    queryFn: () => gamificationApi.getProfile(patientId),
    enabled: !!patientId,
  });

  if (!patientId) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
        <Award className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p>{L('حسابك غير مرتبط بملف مريض بعد، لذا لا يمكن عرض إحصائيات التمارين.', 'Your account is not linked to a patient profile yet, so gamification data cannot be displayed.')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-600 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
        <p>{L('حدث خطأ أثناء تحميل بيانات النقاط.', 'Failed to load gamification data.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-xl border border-orange-100 bg-gradient-to-b from-orange-50 to-white p-6 text-center shadow-sm dark:border-orange-900/30 dark:from-orange-900/10 dark:to-gray-900">
          <div className="mb-2 rounded-full bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400">
            <Flame className="h-8 w-8" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{profile.currentStreak}</p>
          <p className="text-sm font-medium uppercase tracking-wide text-orange-600 dark:text-orange-400">
            {L('أيام متتالية', 'Day Streak')}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-yellow-100 bg-gradient-to-b from-yellow-50 to-white p-6 text-center shadow-sm dark:border-yellow-900/30 dark:from-yellow-900/10 dark:to-gray-900">
          <div className="mb-2 rounded-full bg-yellow-100 p-3 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400">
            <Star className="h-8 w-8" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{profile.points}</p>
          <p className="text-sm font-medium uppercase tracking-wide text-yellow-600 dark:text-yellow-400">
            {L('إجمالي النقاط', 'Total Points')}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-white p-6 text-center shadow-sm dark:border-indigo-900/30 dark:from-indigo-900/10 dark:to-gray-900">
          <div className="mb-2 rounded-full bg-indigo-100 p-3 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            <Trophy className="h-8 w-8" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{profile.tier}</p>
          <p className="text-sm font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {L('المستوى الحالي', 'Current Tier')}
          </p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/50">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-primary-500" />
            {L('الأوسمة المكتسبة', 'Earned Badges')}
          </h3>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {profile.badges.length} {L('أوسمة', 'Badges')}
          </span>
        </div>
        
        {profile.badges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Award className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">
              {L('لم تكتسب أي أوسمة حتى الآن. استمر في التمارين!', 'No badges earned yet. Keep exercising!')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profile.badges.map((badge) => (
              <div 
                key={badge.id}
                className="flex flex-col items-center rounded-xl border border-gray-100 bg-gray-50 p-4 text-center transition-transform hover:scale-105 dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Dynamically render icon based on badge.icon string if we had a mapping, but for now fallback */}
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-primary-600 shadow-sm dark:from-primary-900/40 dark:to-primary-800/40 dark:text-primary-300">
                  <Award size={28} />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{badge.name}</h4>
                {badge.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
