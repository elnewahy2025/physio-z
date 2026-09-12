import React, { useState } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  ShieldExclamationIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import {
  clinicalDecisionService,
  type DiagnosisSuggestion,
  type OutcomePrediction,
  type TreatmentProtocol,
} from '../services/clinical-decision.service';

interface ClinicalDecisionModalProps {
  onClose: () => void;
  onSelectProtocol?: (protocol: TreatmentProtocol) => void;
  initialDiagnosis?: string;
}

const ClinicalDecisionModal: React.FC<ClinicalDecisionModalProps> = ({
  onClose,
  onSelectProtocol,
  initialDiagnosis,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'outcome'>('diagnosis');

  // Diagnosis tab state
  const [bodyRegion, setBodyRegion] = useState('KNEE');
  const [symptoms, setSymptoms] = useState('');
  const [painType, setPainType] = useState('sharp');
  const [painIntensity, setPainIntensity] = useState(7);
  const [patientAge, setPatientAge] = useState(28);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestions, setSuggestions] = useState<DiagnosisSuggestion[]>([]);

  // Outcome tab state
  const [outcomeDiagnosis, setOutcomeDiagnosis] = useState(initialDiagnosis || 'الانزلاق الغضروفي القطني وعرق النسا');
  const [outcomePain, setOutcomePain] = useState(7);
  const [outcomeAge, setOutcomeAge] = useState(35);
  const [adherenceScore, setAdherenceScore] = useState(85);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [prediction, setPrediction] = useState<OutcomePrediction | null>(null);

  const handleAnalyzeDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSuggestion(true);
    try {
      const res = await clinicalDecisionService.suggestDiagnosis({
        bodyRegion,
        symptoms,
        painType,
        painIntensity,
        age: patientAge,
      });
      setSuggestions(res.suggestions);
    } catch (err) {
      console.error('Failed to get diagnosis suggestion:', err);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handlePredictOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPrediction(true);
    try {
      const res = await clinicalDecisionService.predictOutcome({
        diagnosis: outcomeDiagnosis,
        initialPain: outcomePain,
        age: outcomeAge,
        adherenceScore,
      });
      setPrediction(res);
    } catch (err) {
      console.error('Failed to predict outcome:', err);
    } finally {
      setLoadingPrediction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-l from-indigo-800 via-indigo-700 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">المساعد السريري الذكي (Clinical Decision Support)</h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                نظام دعم القرار الطبي: اقتراح التشخيص التفريقي والاختبارات السريرية، والتنبؤ بمسار الشفاء.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === 'diagnosis'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <CheckBadgeIcon className="w-4 h-4" />
            اقتراح التشخيص والبروتوكول المناسب
          </button>
          <button
            onClick={() => {
              setActiveTab('outcome');
              if (!prediction) {
                // Auto run initial prediction
                clinicalDecisionService
                  .predictOutcome({
                    diagnosis: outcomeDiagnosis,
                    initialPain: outcomePain,
                    age: outcomeAge,
                    adherenceScore,
                  })
                  .then(setPrediction)
                  .catch(console.error);
              }
            }}
            className={`py-3.5 px-4 font-bold text-xs border-b-2 flex items-center gap-2 transition ${
              activeTab === 'outcome'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ChartBarIcon className="w-4 h-4" />
            التنبؤ بمسار التعافي والشفاء
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'diagnosis' ? (
            <div className="space-y-6">
              {/* Form inputs */}
              <form onSubmit={handleAnalyzeDiagnosis} className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Region */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      المنطقة التشريحية للمفصل / الألم
                    </label>
                    <select
                      value={bodyRegion}
                      onChange={(e) => setBodyRegion(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-2.5 font-medium"
                    >
                      <option value="KNEE">الركبة (Knee)</option>
                      <option value="LUMBAR">الفقرات القطنية / أسفل الظهر (Lumbar)</option>
                      <option value="SHOULDER">الكتف (Shoulder)</option>
                      <option value="CERVICAL">الرقبة (Cervical)</option>
                      <option value="ANKLE">القدم والكاحل (Foot / Ankle)</option>
                      <option value="NEURO">الجهاز العصبي / السكتة الدماغية (Neuro)</option>
                    </select>
                  </div>

                  {/* Pain Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      طبيعة الألم والشعور
                    </label>
                    <select
                      value={painType}
                      onChange={(e) => setPainType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-2.5 font-medium"
                    >
                      <option value="sharp">حاد مباغت (Sharp / Stabbing)</option>
                      <option value="dull">خفيف متواصل (Dull / Aching)</option>
                      <option value="burning">حارق / تنميل (Burning / Tingling)</option>
                      <option value="throbbing">نابض (Throbbing)</option>
                      <option value="instability">عدم ثبات وسقوط (Giving way / Instability)</option>
                    </select>
                  </div>

                  {/* Pain Scale */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        شدة الألم: {painIntensity} / 10
                      </label>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={painIntensity}
                      onChange={(e) => setPainIntensity(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 mt-2"
                    />
                  </div>
                </div>

                {/* Symptoms description */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    الأعراض وآلية حدوث الإصابة (سرد المريض)
                  </label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="مثال: سماع صوت طقطقة أثناء الالتواء، أو تنميل ممتد للقدم، أو ألم عند رفع الذراع..."
                    className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-3"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingSuggestion}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {loadingSuggestion ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        جارِ التحليل والمطابقة...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4 text-yellow-300" />
                        تحليل ومطابقة الأدلة السريرية
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Suggestions Results */}
              {suggestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-emerald-600" />
                    التشخيص المقترح وفق الإرشادات السريرية (Clinical Decision):
                  </h3>

                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-5 shadow-sm space-y-4"
                    >
                      {/* Top diagnosis bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-gray-900 dark:text-gray-100">
                              {item.diagnosisAr}
                            </h4>
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {item.icdCode}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-0.5" dir="ltr">
                            {item.diagnosis}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                          <span>دقة المطابقة:</span>
                          <span className="text-sm">{item.confidence}%</span>
                        </div>
                      </div>

                      {/* Physical Tests */}
                      <div>
                        <span className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">
                          🩺 الفحوصات السريرية الموصى بإجرائها في العيادة لتأكيد التشخيص:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {item.recommendedPhysicalTests?.map((t, ti) => (
                            <div
                              key={ti}
                              className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700 text-xs space-y-1"
                            >
                              <span className="font-bold text-indigo-700 dark:text-indigo-400 block">{t.nameAr}</span>
                              <span className="text-[11px] text-gray-500 block font-mono" dir="ltr">{t.name}</span>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug">{t.purpose}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Red flags */}
                      {item.redFlags && item.redFlags.length > 0 && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40 text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
                          <ShieldExclamationIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">استبعاد الحالات الطارئة (Red Flags to screen): </span>
                            <span>{item.redFlags.join(' • ')}</span>
                          </div>
                        </div>
                      )}

                      {/* Matched Protocol Action */}
                      <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <div className="text-xs">
                          <span className="text-gray-500 block">البروتوكول التأهيلي الموصى به:</span>
                          <strong className="text-indigo-900 dark:text-indigo-200 font-bold">{item.protocolTitleAr}</strong>
                        </div>

                        {onSelectProtocol && item.suggestedProtocolId && (
                          <button
                            onClick={async () => {
                              try {
                                const proto = await clinicalDecisionService.getProtocolById(item.suggestedProtocolId);
                                onSelectProtocol(proto);
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
                          >
                            <span>عرض وتطبيق البروتوكول</span>
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Outcome tab */
            <div className="space-y-6">
              <form onSubmit={handlePredictOutcome} className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      التشخيص الطبي
                    </label>
                    <input
                      type="text"
                      value={outcomeDiagnosis}
                      onChange={(e) => setOutcomeDiagnosis(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      عمر المريض: {outcomeAge} سنة
                    </label>
                    <input
                      type="number"
                      value={outcomeAge}
                      onChange={(e) => setOutcomeAge(parseInt(e.target.value))}
                      className="w-full text-xs rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 p-2.5"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      درجة الالتزام المتوقعة: {adherenceScore}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={adherenceScore}
                      onChange={(e) => setAdherenceScore(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingPrediction}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {loadingPrediction ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        جارِ الحساب...
                      </>
                    ) : (
                      <>
                        <ChartBarIcon className="w-4 h-4" />
                        تحديث التنبؤ السريري
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Prediction Results Display */}
              {prediction && (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">نسبة نجاح التعافي المتوقعة</span>
                      <span className="block text-3xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-1">
                        {prediction.successProbability}%
                      </span>
                      <span className="text-[11px] text-emerald-600 mt-1 block">بناءً على التزام 85%+ وبروتوكولات التأهيل</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">المدة التقديرية للتعافي الكامل</span>
                      <span className="block text-3xl font-extrabold text-blue-800 dark:text-blue-200 mt-1">
                        {prediction.totalEstimatedWeeks} أسابيع
                      </span>
                      <span className="text-[11px] text-blue-600 mt-1 block">بمعدل 2-3 جلسات أسبوعياً</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40">
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">انخفاض الألم المتوقع</span>
                      <span className="block text-3xl font-extrabold text-purple-800 dark:text-purple-200 mt-1">
                        -{prediction.painDropPct}%
                      </span>
                      <span className="text-[11px] text-purple-600 mt-1 block">تراجع تدريجي من {outcomePain}/10 إلى &lt; 1/10</span>
                    </div>
                  </div>

                  {/* Recovery Trajectory Milestones */}
                  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 space-y-3">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                      <HeartIcon className="w-4 h-4 text-red-500" />
                      منحنى تراجع الألم ومحطات التعافي (Recovery Trajectory):
                    </h4>

                    <div className="space-y-2">
                      {prediction.painTrajectory?.map((pt, pti) => (
                        <div key={pti} className="flex items-center gap-3 text-xs">
                          <span className="w-20 font-bold text-gray-500">الأسبوع {pt.week}:</span>
                          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${(pt.painLevel / 10) * 100}%` }}
                            />
                          </div>
                          <span className="w-16 font-bold text-gray-700 dark:text-gray-300 font-mono">
                            {pt.painLevel} / 10
                          </span>
                          <span className="text-[11px] text-gray-500 hidden md:inline">
                            {pt.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {prediction.clinicalRecommendations && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1">
                      <span className="font-bold text-indigo-900 dark:text-indigo-200 block">💡 توصيات سريرية لضمان أعلى معدل شفاء:</span>
                      <ul className="list-disc list-inside space-y-1 text-indigo-800 dark:text-indigo-300 pr-1">
                        {prediction.clinicalRecommendations.map((rec, ri) => (
                          <li key={ri}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalDecisionModal;
