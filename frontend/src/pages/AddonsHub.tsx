import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  CheckCircleIcon,
  LockClosedIcon,
  AdjustmentsHorizontalIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  CheckIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import { useClinicFeatures, ADDON_FEATURES, AddonFeatureDef } from '../hooks/useClinicFeatures';
import { useAuthStore } from '../store/auth';
import { useI18n } from '../i18n';

const AddonsHub: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    isFeatureEnabled,
    activeCount,
    totalCount,
    isAllUnlocked,
    toggleFeature,
    unlockAllFeatures,
    lockAllFeatures,
    isUpdating,
  } = useClinicFeatures();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [requestModalFeature, setRequestModalFeature] = useState<AddonFeatureDef | null>(null);

  const isAdmin = user?.role === 'OWNER';

  const categories = [
    { id: 'ALL', labelEn: 'All Add-Ons', labelAr: 'كافة الإضافات' },
    { id: 'communication', labelEn: 'Communication', labelAr: 'التواصل والمواعيد' },
    { id: 'clinical', labelEn: 'Clinical & Care', labelAr: 'الرعاية السريرية' },
    { id: 'intelligence', labelEn: 'AI & Analytics', labelAr: 'الذكاء الاصطناعي' },
    { id: 'finance', labelEn: 'Finance & Payments', labelAr: 'المالية والدفع' },
    { id: 'system', labelEn: 'System & Security', labelAr: 'النظام والأمان' },
  ];

  const filteredFeatures = useMemo(() => {
    if (selectedCategory === 'ALL') return ADDON_FEATURES;
    return ADDON_FEATURES.filter((f) => f.category === selectedCategory);
  }, [selectedCategory]);

  const activePercent = Math.round((activeCount / totalCount) * 100);

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero / Pro Pack Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-900 via-indigo-900 to-primary-800 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-yellow-300 backdrop-blur-sm">
              <SparklesIcon className="w-4 h-4" />
              <span>{L('باقة ميزات Physio-Z المتقدمة', 'Physio-Z Pro Add-Ons Suite')}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              {L('مركز الميزات والإضافات المتقدمة', 'Advanced Add-Ons & Features Hub')}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
              {L(
                'استكشف الإضافات البرمجية المتقدمة المصممة لتسريع نمو العيادة، وأتمتة التواصل، وتطبيق الذكاء الاصطناعي السريري.',
                'Discover powerful add-ons designed to accelerate clinic growth, automate communications, and empower evidence-based clinical intelligence.'
              )}
            </p>
          </div>

          {/* Licensing Progress Card */}
          <div className="w-full md:w-auto bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 min-w-[280px] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-200 font-semibold">{L('حالة ترخيص العيادة:', 'Clinic License Status:')}</span>
              <span className="font-bold font-mono text-yellow-300">
                {activeCount} / {totalCount} {L('مفعل', 'Active')} ({activePercent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-green-300 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${activePercent}%` }}
              />
            </div>

            {/* Admin Controls */}
            {isAdmin && (
              <button
                onClick={() => setShowAdminModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-gray-900 text-xs font-bold hover:bg-gray-100 transition shadow-sm"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4 text-primary-600" />
                <span>{L('إدارة تراخيص الميزات (Super Admin)', 'Manage Licenses (Admin)')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {isRTL ? cat.labelAr : cat.labelEn}
          </button>
        ))}
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => {
          const isUnlocked = isFeatureEnabled(feature.key);
          return (
            <div
              key={feature.key}
              className={`rounded-3xl p-6 transition-all duration-300 border flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                  : 'bg-gray-50/60 dark:bg-gray-900/40 border-gray-200/60 dark:border-gray-800 shadow-none'
              }`}
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/40 flex items-center justify-center text-2xl">
                    {feature.icon}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {feature.isPopular && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                        {L('الأكثر طلباً', 'Popular')}
                      </span>
                    )}
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>{L('مفعل', 'Active')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        <LockClosedIcon className="w-3 h-3" />
                        <span>{L('مغلق', 'Locked')}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Feature Title */}
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {isRTL ? feature.nameAr : feature.nameEn}
                </h3>

                {/* Feature Description */}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {isRTL ? feature.descriptionAr : feature.descriptionEn}
                </p>
              </div>

              {/* Card Bottom Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <span className="text-[11px] font-mono text-gray-400">
                  {feature.category.toUpperCase()}
                </span>

                {isUnlocked ? (
                  <button
                    onClick={() => navigate(feature.path)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    <span>{L('فتح الميزة', 'Open Feature')}</span>
                    {isRTL ? <ArrowLeftIcon className="w-3.5 h-3.5" /> : <ArrowRightIcon className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (isAdmin) {
                        toggleFeature(feature.key);
                      } else {
                        setRequestModalFeature(feature);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold transition"
                  >
                    <LockClosedIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isAdmin ? L('تفعيل الميزة', 'Unlock Now') : L('طلب ترخيص', 'Request License')}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Feature Management Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/40">
              <div className="flex items-center gap-2.5">
                <ShieldCheckIcon className="w-6 h-6 text-primary-600" />
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {L('إدارة تراخيص الميزات والإضافات', 'Feature Licenses & Add-Ons Manager')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {L('صلاحيات Super Admin / Owner للتحكم في الميزات النشطة للعيادة', 'Super Admin / Owner switches to toggle features for this clinic')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Bundle Actions */}
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RocketLaunchIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  {L('إجراءات الباقة السريعة:', 'Quick Bundle Actions:')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => unlockAllFeatures()}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {L('تفعيل الكل (الباقة الكاملة)', 'Unlock All (Pro Bundle)')}
                </button>
                <button
                  onClick={() => lockAllFeatures()}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs font-bold transition disabled:opacity-50"
                >
                  {L('تعطيل الكل', 'Lock All')}
                </button>
              </div>
            </div>

            {/* Feature Toggles List */}
            <div className="p-6 space-y-3 overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-700/60">
              {ADDON_FEATURES.map((feature) => {
                const isEnabled = isFeatureEnabled(feature.key);
                return (
                  <div key={feature.key} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{feature.icon}</span>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                          {isRTL ? feature.nameAr : feature.nameEn}
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">
                          {isRTL ? feature.descriptionAr : feature.descriptionEn}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleFeature(feature.key)}
                      disabled={isUpdating}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                        isEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isEnabled ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowAdminModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold transition shadow-sm"
              >
                {L('تم الحفظ', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Purchase Request Modal */}
      {requestModalFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto text-2xl">
              {requestModalFeature.icon}
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {L('طلب تفعيل ميزة إضافية', 'Request Add-On Activation')}
            </h3>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {L(
                `لتفعيل "${requestModalFeature.nameAr}" لعيادتك أو الاستفسار عن باقات الميزات الشاملة، يرجى التواصل مع المدير المالي أو إدارة المنصة.`,
                `To unlock "${requestModalFeature.nameEn}" or purchase the complete Physio-Z Pro Pack for your clinic, please contact your administrator.`
              )}
            </p>

            <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 font-mono">
              admin@physio-z.com • +20 100 000 0000
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setRequestModalFeature(null)}
                className="px-6 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition shadow-sm"
              >
                {L('حسناً', 'Got it')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddonsHub;
