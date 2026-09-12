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
import { useI18n } from '../../../i18n';

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
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

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
  const [outcomeDiagnosis, setOutcomeDiagnosis] = useState(
    initialDiagnosis || L('الانزلاق الغضروفي القطني وعرق النسا', 'Lumbar Disc Herniation & Radiculopathy')
  );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-l from-indigo-800 via-indigo-700 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {L('المساعد السريري الذكي (Clinical Decision Support)', 'Clinical Decision Support (CDSS)')}
              </h2>
              <p className="text-xs text-indigo-100 mt-0.5">
                {L(
                  'نظام دعم القرار الطبي: اقتراح التشخيص التفريقي والاختبارات السريرية، والتنبؤ بمسار الشفاء.',
                  'Evidence-based differential diagnosis suggestions, clinical special tests, and recovery trajectory predictions.'
                )}
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
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 px-6 pt-3">
          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'diagnosis'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>{L('التشخيص التفريقي والفحوصات (Differential Diagnosis)', 'Differential Diagnosis & Tests')}</span>
          </button>

          <button
            onClick={() => setActiveTab('outcome')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'outcome'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <ChartBarIcon className="w-4 h-4" />
            <span>{L('التنبؤ بالتعافي ومسار الشفاء (Recovery Trajectory)', 'Recovery Trajectory & Outcomes')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'diagnosis' ? (
            <div className="space-y-6">
              {/* Form inputs */}
              <form onSubmit={handleAnalyzeDiagnosis} className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Region */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {L('المنطقة التشريحية للمفصل / الألم', 'Anatomical Region / Joint')}
                    </label>
                    <select
                      value={bodyRegion}
                      onChange={(e) => setBodyRegion(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 font-medium focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="KNEE">{L('الركبة (Knee)', 'Knee')}</option>
                      <option value="LUMBAR">{L('الفقرات القطنية / أسفل الظهر (Lumbar)', 'Lumbar Spine')}</option>
                      <option value="SHOULDER">{L('الكتف (Shoulder)', 'Shoulder')}</option>
                      <option value="CERVICAL">{L('الرقبة (Cervical)', 'Cervical Spine')}</option>
                      <option value="ANKLE">{L('القدم والكاحل (Foot / Ankle)', 'Foot & Ankle')}</option>
                      <option value="NEURO">{L('الجهاز العصبي / السكتة الدماغية (Neuro)', 'Neurological / Stroke')}</option>
                    </select>
                  </div>

                  {/* Pain Type */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {L('طبيعة الألم والشعور', 'Pain Sensation Type')}
                    </label>
                    <select
                      value={painType}
                      onChange={(e) => setPainType(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 font-medium focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="sharp">{L('حاد مباغت (Sharp / Stabbing)', 'Sharp / Stabbing')}</option>
                      <option value="dull">{L('خفيف متواصل (Dull / Aching)', 'Dull / Aching')}</option>
                      <option value="burning">{L('حارق / تنميل (Burning / Tingling)', 'Burning / Tingling')}</option>
                      <option value="throbbing">{L('نابض (Throbbing)', 'Throbbing')}</option>
                      <option value="instability">{L('عدم ثبات وسقوط (Giving way / Instability)', 'Giving way / Instability')}</option>
                    </select>
                  </div>

                  {/* Pain Scale */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {L('شدة الألم', 'Pain Severity')}: {painIntensity} / 10
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
                    {L('الأعراض وآلية حدوث الإصابة (سرد المريض)', 'Symptoms & Injury Mechanism')}
                  </label>
                  <input
                    type="text"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder={L(
                      'مثال: سماع صوت طقطقة أثناء الالتواء، أو تنميل ممتد للقدم، أو ألم عند رفع الذراع...',
                      'e.g. popping sound during twisting, radicular numbness to foot, pain during shoulder elevation...'
                    )}
                    className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 p-3 focus:ring-indigo-500 focus:border-indigo-500"
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
                        {L('جارِ التحليل والمطابقة...', 'Analyzing & Matching...')}
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4 text-yellow-300" />
                        {L('تحليل ومطابقة الأدلة السريرية', 'Analyze Clinical Evidence')}
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Suggestions Results */}
              {suggestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <CheckBadgeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>{L('التشخيصات المحتملة والتوصيات المعتمدة', 'Differential Diagnosis Matches & Clinical Recommendations')}</span>
                  </h3>

                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900/50 shadow-sm space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              {Math.round(item.confidence > 1 ? item.confidence : item.confidence * 100)}% {L('مطابقة سريرية', 'Match')}
                            </span>
                            {item.icdCode && (
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                ICD: {item.icdCode}
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                            {isRTL ? (item.diagnosisAr || item.diagnosis) : item.diagnosis}
                          </h4>
                          <p className="text-xs text-gray-500 font-mono mt-0.5" dir="ltr">
                            {isRTL ? item.diagnosis : (item.diagnosisAr || item.diagnosis)}
                          </p>
                        </div>
                      </div>

                      {/* Special Tests to Confirm */}
                      {item.recommendedPhysicalTests && item.recommendedPhysicalTests.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 space-y-1.5">
                          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block">
                            🩺 {L('اختبارات سريرية خاصة لتأكيد التشخيص (Special Orthopedic Tests):', 'Recommended Special Tests to Confirm:')}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {item.recommendedPhysicalTests.map((t, i) => (
                              <span
                                key={i}
                                title={t.purpose}
                                className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-medium"
                              >
                                {isRTL ? (t.nameAr || t.name) : t.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Red flags */}
                      {item.redFlags && item.redFlags.length > 0 && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/40 text-xs text-red-800 dark:text-red-200 flex items-start gap-2">
                          <ShieldExclamationIcon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">{L('استبعاد الحالات الطارئة (Red Flags to screen): ', 'Red Flags to Screen: ')}</span>
                            <span>{item.redFlags.join(' • ')}</span>
                          </div>
                        </div>
                      )}

                      {/* Matched Protocol Action */}
                      <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <div className="text-xs">
                          <span className="text-gray-500 dark:text-gray-400 block">{L('البروتوكول التأهيلي الموصى به:', 'Recommended Protocol:')}</span>
                          <strong className="text-indigo-900 dark:text-indigo-200 font-bold">{isRTL ? item.protocolTitleAr : item.protocolTitle}</strong>
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
                            <span>{L('عرض وتطبيق البروتوكول', 'Apply Protocol')}</span>
                            <ArrowRightIcon className={`w-3.5 h-3.5 ${isRTL ? '' : 'rotate-180'}`} />
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
              <form onSubmit={handlePredictOutcome} className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {L('التشخيص الطبي', 'Medical Diagnosis')}
                    </label>
                    <input
                      type="text"
                      value={outcomeDiagnosis}
                      onChange={(e) => setOutcomeDiagnosis(e.target.value)}
                      className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {L('عمر المريض', 'Patient Age')}: {outcomeAge} {L('سنة', 'yrs')}
                    </label>
                    <input
                      type="number"
                      value={outcomeAge}
                      onChange={(e) => setOutcomeAge(parseInt(e.target.value))}
                      className="w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      {L('درجة الالتزام المتوقعة', 'Expected Adherence')}: {adherenceScore}%
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
                        {L('جارِ حساب التنبؤات...', 'Calculating Trajectory...')}
                      </>
                    ) : (
                      <>
                        <ChartBarIcon className="w-4 h-4" />
                        {L('توليد مسار الشفاء المتوقع', 'Simulate Recovery Path')}
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Prediction Results */}
              {prediction && (
                <div className="space-y-6">
                  {/* High level metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        {L('احتمالية التعافي الإيجابي', 'Recovery Probability')}
                      </span>
                      <span className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1 block">
                        {prediction.successProbability}%
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                        {L('بناءً على التزام المريض بالبروتوكول', 'Based on exercise adherence')}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold block">
                        {L('المدة الزمنية المتوقعة للشفاء', 'Estimated Time to Recovery')}
                      </span>
                      <span className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1 block">
                        {prediction.totalEstimatedWeeks} {L('أسابيع', 'weeks')}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                        {L('تحت إشراف أخصائي العلاج الطبيعي', 'Supervised physiotherapy')}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block">
                        {L('تراجع الألم المتوقع', 'Pain Reduction')}
                      </span>
                      <span className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1 block">
                        {outcomePain} / 10 ➔ {prediction.painTrajectory?.slice(-1)[0]?.painLevel ?? 0} / 10
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                        {L('انخفاض ملحوظ في شدة الألم', 'Noticeable pain relief')}
                      </span>
                    </div>
                  </div>

                  {/* Pain Reduction Curve */}
                  {prediction.painTrajectory && prediction.painTrajectory.length > 0 && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        📈 {L('منحنى تراجع شدة الألم أسبوعياً (Pain Curve)', 'Weekly Pain Reduction Curve')}
                      </h4>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {prediction.painTrajectory.map((curve, idx) => (
                          <div key={idx} title={curve.description} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-center border border-gray-100 dark:border-gray-700">
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 block">{L('أسبوع', 'Wk')} {curve.week}</span>
                            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                              {curve.painLevel} / 10
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones timeline */}
                  {prediction.milestones && prediction.milestones.length > 0 && (
                    <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100">
                        🎯 {L('محطات التعافي السريرية المتوقعة (Rehabilitation Milestones)', 'Rehabilitation Milestones')}
                      </h4>
                      <div className="space-y-3">
                        {prediction.milestones.map((m, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] whitespace-nowrap">
                              {L('أسبوع', 'Week')} {m.week}
                            </span>
                            <div>
                              <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100">{m.milestone}</h5>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition"
          >
            {L('إغلاق', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalDecisionModal;
