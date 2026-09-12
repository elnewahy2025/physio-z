import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LockClosedIcon, SparklesIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useClinicFeatures, ADDON_FEATURES } from '../hooks/useClinicFeatures';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';

interface FeatureRouteGuardProps {
  featureKey: string;
  children: React.ReactNode;
}

const FeatureRouteGuard: React.FC<FeatureRouteGuardProps> = ({ featureKey, children }) => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isFeatureEnabled, isLoading, toggleFeature, isUpdating } = useClinicFeatures();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const enabled = isFeatureEnabled(featureKey);

  if (enabled) {
    return <>{children}</>;
  }

  const featureDef = ADDON_FEATURES.find((f) => f.key === featureKey);
  const isAdmin = user?.role === 'OWNER';

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <LockClosedIcon className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 dark:text-amber-400" />
        </div>

        {/* Feature Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 mb-4">
          <span>{featureDef?.icon || '✨'}</span>
          <span>{isRTL ? featureDef?.nameAr : featureDef?.nameEn}</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">
          {L('هذه الميزة تتطلب ترخيصاً إضافياً', 'This Feature Requires an Add-On License')}
        </h2>

        {/* Description */}
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
          {isRTL
            ? (featureDef?.descriptionAr || 'هذه الميزة غير مفعلة ضمن خطة عيادتك الحالية. يمكنك ترقية اشتراكك أو شراء هذه الإضافة من مركز الميزات الإضافية.')
            : (featureDef?.descriptionEn || 'This module is currently locked under your active clinic plan. You can unlock it individually or activate the complete Physio-Z Pro Pack.')}
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/addons')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold transition shadow-md"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>{L('استعراض مركز الميزات الإضافية', 'Explore Add-Ons Hub')}</span>
            {isRTL ? <ArrowLeftIcon className="w-4 h-4" /> : <ArrowRightIcon className="w-4 h-4" />}
          </button>

          {isAdmin && (
            <button
              onClick={() => toggleFeature(featureKey)}
              disabled={isUpdating}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-bold transition disabled:opacity-50"
            >
              {isUpdating ? L('جارٍ التفعيل...', 'Unlocking...') : L('تفعيل الميزة الآن (إدارة العيادة)', 'Unlock Feature Now (Admin Action)')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureRouteGuard;
