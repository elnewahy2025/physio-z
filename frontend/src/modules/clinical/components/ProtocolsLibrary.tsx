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
import { useI18n } from '../../../i18n';

export const ProtocolsLibrary: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const regionFilters = [
    { id: 'ALL', label: L('كافة المناطق', 'All Regions'), icon: '🩺' },
    { id: 'KNEE', label: L('الركبة (Knee)', 'Knee'), icon: '🦵' },
    { id: 'LUMBAR', label: L('أسفل الظهر (Lumbar)', 'Lumbar Spine'), icon: '🦴' },
    { id: 'SHOULDER', label: L('الكتف (Shoulder)', 'Shoulder'), icon: '💪' },
    { id: 'CERVICAL', label: L('الرقبة (Neck)', 'Cervical Spine'), icon: '👤' },
    { id: 'ANKLE', label: L('القدم والكاحل (Foot)', 'Foot & Ankle'), icon: '🦶' },
    { id: 'NEURO', label: L('التأهيل العصبي (Neuro)', 'Neuromotor Rehab'), icon: '🧠' },
  ];

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
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-blue-700 via-indigo-700 to-primary-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
              <BookOpenIcon className="w-4 h-4" />
              Evidence-Based Clinical Decision Support (APTA / JOSPT / WHO)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {L('مكتبة بروتوكولات العلاج الطبيعي المبنية على الأدلة', 'Evidence-Based Physical Therapy Protocols')}
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              {L(
                'مسارات علاجية قياسية لكل تشخيص طبي مقسمة إلى مراحل تأهيلية (Phased Rehabilitation)، تشمل الأهداف الحركية، الوسائل العلاجية، موانع الاستعمال، والتمارين الموصى بها.',
                'Standardized clinical pathways for medical diagnoses structured in phased rehabilitation, including functional goals, modalities, precautions, and recommended exercises.'
              )}
            </p>
          </div>

          <button
            onClick={() => setShowCDSSModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-700 font-bold text-sm shadow-lg hover:bg-blue-50 transition transform hover:-translate-y-0.5"
          >
            <SparklesIcon className="w-5 h-5 text-indigo-600" />
            {L('المساعد السريري الذكي (التشخيص والتنبؤ)', 'CDSS Clinical Assistant (AI & Outcomes)')}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        {/* Region Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {regionFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedRegion(f.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedRegion === f.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            <MagnifyingGlassIcon className={`w-5 h-5 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={L(
                'ابحث بالتشخيص الطبي، اسم البروتوكول، أو رمز ICD...',
                'Search by medical diagnosis, protocol title, or ICD code...'
              )}
              className={`w-full ${isRTL ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 rounded-xl text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-indigo-500 focus:border-indigo-500`}
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-700 text-white font-semibold text-xs hover:bg-black dark:hover:bg-gray-600 transition"
          >
            {L('بحث', 'Search')}
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
          <BookOpenIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
            {L('لم يتم العثور على بروتوكولات مطابقة', 'No matching protocols found')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {L('جرب تغيير تصفية المنطقة التشريحية أو إعادة تعيين البحث.', 'Try changing the anatomical region filter or resetting search.')}
          </p>
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

                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition line-clamp-2 mb-1">
                  {isRTL ? proto.titleAr : proto.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-3 line-clamp-1" dir="ltr">
                  {isRTL ? proto.title : proto.titleAr}
                </p>

                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-4">
                  {isRTL ? proto.descriptionAr : proto.description}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span>{proto.expectedDurationWeeks} {L('أسبوعاً', 'weeks')}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>{proto.successRatePct}% {L('نجاح', 'success')}</span>
                </div>
                <div className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                  <span>{proto.phases?.length || 0} {L('مراحل', 'phases')}</span>
                  <span>{isRTL ? '←' : '→'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Protocol Details Modal / Drawer */}
      {selectedProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
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
                <h2 className="text-xl font-black">{isRTL ? selectedProtocol.titleAr : selectedProtocol.title}</h2>
                <p className="text-xs text-indigo-100 mt-0.5 font-mono" dir="ltr">
                  {isRTL ? selectedProtocol.title : selectedProtocol.titleAr}
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
                  <span className="block text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">{L('المصدر العلمي والأدلة', 'Evidence Guideline')}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 block">{selectedProtocol.evidenceSource}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{L('معدل التعافي المتوقع', 'Expected Recovery Rate')}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 block">{selectedProtocol.successRatePct}% {L('نجاح سريري', 'clinical success')}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <span className="block text-[11px] text-blue-600 dark:text-blue-400 font-semibold">{L('المدة التقديرية', 'Estimated Duration')}</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 mt-0.5 block">{selectedProtocol.expectedDurationWeeks} {L('أسبوعاً', 'weeks')}</span>
                </div>
              </div>

              {/* Precautions Alert */}
              {selectedProtocol.precautions && selectedProtocol.precautions.length > 0 && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-2">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-300 font-bold text-xs">
                    <ShieldExclamationIcon className="w-5 h-5 text-red-600" />
                    <span>{L('محاذير سريرية وموانع استعمال (Clinical Precautions & Red Flags)', 'Clinical Precautions & Red Flags')}</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-300 space-y-1">
                    {selectedProtocol.precautions.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Phases Accordion */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {L('المراحل التأهيلية التفصيلية (Rehabilitation Phases)', 'Rehabilitation Phases')}
                </h4>

                <div className="space-y-3">
                  {selectedProtocol.phases?.map((phase: TreatmentPhase) => {
                    const isOpen = expandedPhase === phase.phaseNumber;
                    return (
                      <div
                        key={phase.phaseNumber}
                        className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
                      >
                        <button
                          onClick={() => setExpandedPhase(isOpen ? null : phase.phaseNumber)}
                          className="w-full p-4 flex items-center justify-between bg-gray-50/70 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-start"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                              {phase.phaseNumber}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                {isRTL ? phase.titleAr : phase.title}
                              </h5>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {L('الأسابيع', 'Weeks')}: {phase.weeks}
                              </span>
                            </div>
                          </div>
                          {isOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-500" /> : <ChevronDownIcon className="w-4 h-4 text-gray-500" />}
                        </button>

                        {isOpen && (
                          <div className="p-5 space-y-4 border-t border-gray-100 dark:border-gray-700">
                            {/* Goals */}
                            {phase.goals && phase.goals.length > 0 && (
                              <div>
                                <h6 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                  🎯 {L('الأهداف السريرية', 'Clinical Goals')}
                                </h6>
                                <div className="flex flex-wrap gap-2">
                                  {(isRTL && phase.goalsAr?.length ? phase.goalsAr : phase.goals).map((g, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                                    >
                                      <CheckCircleIcon className="w-3.5 h-3.5" />
                                      <span>{g}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Modalities / Interventions */}
                            {phase.modalities && phase.modalities.length > 0 && (
                              <div>
                                <h6 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                  ⚡ {L('التدخلات العلاجية والوسائل الفيزيائية', 'Interventions & Modalities')}
                                </h6>
                                <div className="flex flex-wrap gap-2">
                                  {(isRTL && phase.modalitiesAr?.length ? phase.modalitiesAr : phase.modalities).map((inv, i) => (
                                    <span
                                      key={i}
                                      className="text-xs px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-medium"
                                    >
                                      {inv}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Exercises */}
                            {phase.recommendedExercises && phase.recommendedExercises.length > 0 && (
                              <div>
                                <h6 className="text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                  🏋️ {L('التمارين الموصى بها', 'Target Exercises')}
                                </h6>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {phase.recommendedExercises.map((ex, i) => (
                                    <div
                                      key={i}
                                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/40 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 border border-gray-100 dark:border-gray-800"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                      <span>{ex}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Precautions */}
                            {phase.precautions && phase.precautions.length > 0 && (
                              <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                                <h6 className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                                  🏁 {L('الاحتياطات ومعايير التدرج', 'Precautions & Progression Criteria')}
                                </h6>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                  {(isRTL && phase.precautionsAr?.length ? phase.precautionsAr : phase.precautions).join(' • ')}
                                </p>
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

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {L('بروتوكول معتمد من الجمعيات الدولية للعلاج الطبيعي', 'International Evidence-Based Protocol')}
              </span>
              <button
                onClick={() => setSelectedProtocol(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
              >
                {L('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CDSS Assistant Modal */}
      {showCDSSModal && (
        <ClinicalDecisionModal
          onClose={() => setShowCDSSModal(false)}
          onSelectProtocol={(proto) => {
            setSelectedProtocol(proto);
            setShowCDSSModal(false);
          }}
        />
      )}
    </div>
  );
};

export default ProtocolsLibrary;
