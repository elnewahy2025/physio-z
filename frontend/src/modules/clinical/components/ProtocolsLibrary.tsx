import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  DocumentCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  clinicalDecisionService,
  type TreatmentProtocol,
  type TreatmentPhase,
} from '../services/clinical-decision.service';
import ClinicalDecisionModal from './ClinicalDecisionModal';

const REGION_FILTERS = [
  { id: 'ALL', label: 'كافة المناطق', icon: '🩺' },
  { id: 'KNEE', label: 'الركبة (Knee)', icon: '🦵' },
  { id: 'LUMBAR', label: 'أسفل الظهر (Lumbar)', icon: '🦴' },
  { id: 'SHOULDER', label: 'الكتف (Shoulder)', icon: '💪' },
  { id: 'CERVICAL', label: 'الرقبة (Neck)', icon: '👤' },
  { id: 'ANKLE', label: 'القدم والكاحل (Foot)', icon: '🦶' },
  { id: 'NEURO', label: 'التأهيل العصبي (Neuro)', icon: '🧠' },
];

export const ProtocolsLibrary: React.FC = () => {
  const [protocols, setProtocols] = useState<TreatmentProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<TreatmentProtocol | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);
  const [showCDSSModal, setShowCDSSModal] = useState(false);

  useEffect(() => {
    loadProtocols();
  }, [selectedRegion]);

  const loadProtocols = async () => {
    setLoading(true);
    try {
      const data = await clinicalDecisionService.getProtocols({
        bodyRegion: selectedRegion,
        search: searchQuery || undefined,
      });
      setProtocols(data);
    } catch (err) {
      console.error('Failed to load clinical protocols:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProtocols();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6" dir="rtl">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-blue-700 via-indigo-700 to-primary-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
              <BookOpenIcon className="w-4 h-4" />
              Evidence-Based Clinical Decision Support (APTA / JOSPT / WHO)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              مكتبة بروتوكولات العلاج الطبيعي المبنية على الأدلة
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              مسارات علاجية قياسية لكل تشخيص طبي مقسمة إلى مراحل تأهيلية (Phased Rehabilitation)، تشمل الأهداف الحركية، الوسائل العلاجية، موانع الاستعمال، والتمارين الموصى بها.
            </p>
          </div>

          <button
            onClick={() => setShowCDSSModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 font-bold text-sm shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-0.5"
          >
            <SparklesIcon className="w-5 h-5 text-indigo-600" />
            المساعد السريري الذكي (التشخيص والتنبؤ)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        {/* Region Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {REGION_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedRegion(f.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedRegion === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالتشخيص الطبي، اسم البروتوكول، أو رمز ICD..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-700 text-white font-semibold text-xs hover:bg-black transition"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Protocols Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
          <ArrowPathIcon className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : protocols.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">لم يتم العثور على بروتوكولات مطابقة</h3>
          <p className="text-xs text-gray-500 mt-1">جرب تغيير تصفية المنطقة التشريحية أو إعادة تعيين البحث.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {protocols.map((proto) => (
            <div
              key={proto.id}
              onClick={() => {
                setSelectedProtocol(proto);
                setExpandedPhase(1);
              }}
              className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    <span>📍</span>
                    <span>{proto.bodyRegion}</span>
                  </span>
                  {proto.diagnosisCode && (
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                      ICD: {proto.diagnosisCode}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition line-clamp-2 mb-1">
                  {proto.titleAr}
                </h3>
                <p className="text-xs text-gray-500 font-mono mb-3 line-clamp-1" dir="ltr">
                  {proto.title}
                </p>

                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-4">
                  {proto.descriptionAr}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span>{proto.expectedDurationWeeks} أسبوعاً</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>نجاح {proto.successRatePct}%</span>
                </div>
                <div className="inline-flex items-center gap-1 text-indigo-600 font-semibold group-hover:underline">
                  <span>{proto.phases?.length || 0} مراحل</span>
                  <span>←</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Protocol Details Modal / Drawer */}
      {selectedProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-l from-indigo-700 to-blue-700 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20">
                    {selectedProtocol.bodyRegion}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20">
                    {selectedProtocol.category}
                  </span>
                  {selectedProtocol.diagnosisCode && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/20">
                      {selectedProtocol.diagnosisCode}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black">{selectedProtocol.titleAr}</h2>
                <p className="text-xs text-indigo-100 mt-0.5 font-mono" dir="ltr">
                  {selectedProtocol.title}
                </p>
              </div>

              <button
                onClick={() => setSelectedProtocol(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Evidence & Duration Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                  <span className="block text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">المصدر العلمي والأدلة</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 block">{selectedProtocol.evidenceSource}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">معدل التعافي المتوقع</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 block">{selectedProtocol.successRatePct}% نجاح سريري</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <span className="block text-[11px] text-blue-600 dark:text-blue-400 font-semibold">المدة التقديرية</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 block">{selectedProtocol.expectedDurationWeeks} أسبوعاً</span>
                </div>
              </div>

              {/* Red Flags / Precautions Alert */}
              {selectedProtocol.precautions && selectedProtocol.precautions.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldExclamationIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>تحذيرات وموانع الاستعمال (Clinical Red Flags & Contraindications):</span>
                  </div>
                  <ul className="list-disc list-inside text-xs space-y-1 pr-2 text-amber-800 dark:text-amber-300">
                    {selectedProtocol.precautions.map((prec, i) => (
                      <li key={i}>{prec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Phased Roadmap Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <DocumentCheckIcon className="w-5 h-5 text-indigo-600" />
                  مراحل خطة التأهيل التدريجية ({selectedProtocol.phases?.length || 0} مراحل)
                </h3>

                <div className="space-y-3">
                  {selectedProtocol.phases?.map((phase: TreatmentPhase) => {
                    const isOpen = expandedPhase === phase.phaseNumber;

                    return (
                      <div
                        key={phase.phaseNumber}
                        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 overflow-hidden shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedPhase(isOpen ? null : phase.phaseNumber)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition text-right"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                              {phase.phaseNumber}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {phase.titleAr}
                              </h4>
                              <p className="text-[11px] text-gray-500 font-mono" dir="ltr">
                                {phase.title} • {phase.weeks}
                              </p>
                            </div>
                          </div>

                          {isOpen ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </button>

                        {isOpen && (
                          <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 space-y-3 text-xs">
                            {/* Goals */}
                            <div>
                              <span className="font-bold text-indigo-700 dark:text-indigo-400 block mb-1">
                                🎯 الأهداف السريرية للمرحلة:
                              </span>
                              <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-gray-300 pr-1">
                                {(phase.goalsAr || phase.goals)?.map((g, gi) => (
                                  <li key={gi}>{g}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Modalities */}
                            <div>
                              <span className="font-bold text-teal-700 dark:text-teal-400 block mb-1">
                                ⚡ الوسائل والتقنيات العلاجية:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {(phase.modalitiesAr || phase.modalities)?.map((m, mi) => (
                                  <span
                                    key={mi}
                                    className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-medium"
                                  >
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Exercises */}
                            {phase.recommendedExercises && phase.recommendedExercises.length > 0 && (
                              <div>
                                <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1">
                                  🏃 التمارين العلاجية الموصى بها:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {phase.recommendedExercises.map((ex, ei) => (
                                    <span
                                      key={ei}
                                      className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-medium"
                                    >
                                      {ex}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Decision Support Interactive Modal */}
      {showCDSSModal && (
        <ClinicalDecisionModal
          onClose={() => setShowCDSSModal(false)}
          onSelectProtocol={(proto) => {
            setShowCDSSModal(false);
            setSelectedProtocol(proto);
          }}
        />
      )}
    </div>
  );
};

export default ProtocolsLibrary;
