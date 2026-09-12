import React, { useState, useEffect, useMemo } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  PhoneIcon,
  ChatBubbleLeftEllipsisIcon,
  UserIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { noShowPredictionService } from '../services/no-show-prediction.service';
import { useI18n } from '../../../i18n';

interface RiskFactors {
  patientNoShowHistory: number;
  patientCancellationHistory: number;
  patientAge: number;
  outstandingBalance: number;
  distanceFromClinic?: number;
  daysUntilAppointment?: number;
}

interface RiskAssessment {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  appointmentDate: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactors;
  recommendations: string[];
}

const recommendationTranslations: Record<string, { ar: string; en: string }> = {
  'اتصل بالمريض لتأكيد الموعد': { ar: 'اتصل بالمريض لتأكيد الموعد', en: 'Call patient to confirm appointment' },
  'أرسل تذكير عبر واتساب': { ar: 'أرسل تذكير عبر واتساب', en: 'Send reminder via WhatsApp' },
  'أرسل تذكير بالبريد الإلكتروني': { ar: 'أرسل تذكير بالبريد الإلكتروني', en: 'Send email reminder' },
  'تأكيد الموعد عبر الرسائل النصية': { ar: 'تأكيد الموعد عبر الرسائل النصية', en: 'Confirm appointment via SMS' },
  'اطلب دفعة مقدمة لتأكيد الموعد': { ar: 'اطلب دفعة مقدمة لتأكيد الموعد', en: 'Request advance deposit to secure slot' },
  'تذكير بالمبالغ المستحقة': { ar: 'تذكير بالمبالغ المستحقة', en: 'Remind of outstanding balance' },
  'تأكيد الموعد عبر الهاتف': { ar: 'تأكيد الموعد عبر الهاتف', en: 'Phone confirmation required' },
  'مرضى لديهم معدل عدم حضور مرتفع': { ar: 'مرضى لديهم معدل عدم حضور مرتفع', en: 'High historical no-show rate' },
  'مرضى يلغون المواعيد بشكل متكرر': { ar: 'مرضى يلغون المواعيد بشكل متكرر', en: 'Frequent cancellation pattern' },
  'مبالغ مستحقة مرتفعة': { ar: 'مبالغ مستحقة مرتفعة', en: 'High outstanding balance' },
};

const NoShowRiskDashboard: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [totalAppointments, setTotalAppointments] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'CRITICAL_HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [sortBy, setSortBy] = useState<'risk_desc' | 'date_asc'>('risk_desc');

  // Contact tracking state
  const [contactedMap, setContactedMap] = useState<Record<string, 'whatsapp' | 'phone' | 'confirmed'>>({});

  // Patient profile modal
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientProfile, setPatientProfile] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await noShowPredictionService.getUpcomingAppointmentsRisk();
      const list: RiskAssessment[] = result.riskAssessments || result.appointments || [];
      setAssessments(list);
      setTotalAppointments(result.totalAppointments ?? result.total ?? list.length);
    } catch (error) {
      console.error('Failed to load upcoming appointments risk:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await noShowPredictionService.getUpcomingAppointmentsRisk();
      const list: RiskAssessment[] = result.riskAssessments || result.appointments || [];
      setAssessments(list);
      setTotalAppointments(result.totalAppointments ?? result.total ?? list.length);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewPatientProfile = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setLoadingProfile(true);
    try {
      const profile = await noShowPredictionService.getPatientRiskProfile(patientId);
      setPatientProfile(profile);
    } catch (err) {
      console.error('Failed to load patient risk profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSendWhatsApp = (item: RiskAssessment) => {
    const phone = item.patientPhone ? item.patientPhone.replace(/[^0-9+]/g, '') : '';
    const dateFormatted = new Date(item.appointmentDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeFormatted = new Date(item.appointmentDate).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const msg = isRTL
      ? `مرحباً ${item.patientName}، نود تذكيرك بموعدك القادم في مركز العلاج الطبيعي يوم ${dateFormatted} في تمام الساعة ${timeFormatted}. يرجى تأكيد حضورك بالرد على هذه الرسالة.`
      : `Hello ${item.patientName}, this is a reminder for your upcoming physiotherapy session on ${dateFormatted} at ${timeFormatted}. Please confirm your attendance by replying to this message.`;

    setContactedMap((prev) => ({ ...prev, [item.appointmentId]: 'whatsapp' }));

    if (phone) {
      window.open(`https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      alert(L('رقم هاتف المريض غير مسجل، تم تسجيل إرسال التذكير بنجاح.', 'Patient phone not specified, reminder logged successfully.'));
    }
  };

  const handleCallPatient = (item: RiskAssessment) => {
    setContactedMap((prev) => ({ ...prev, [item.appointmentId]: 'phone' }));
    if (item.patientPhone) {
      window.location.href = `tel:${item.patientPhone}`;
    } else {
      alert(L('لا يوجد رقم هاتف مسجل للمريض.', 'No phone number on record for this patient.'));
    }
  };

  const handleMarkConfirmed = (appointmentId: string) => {
    setContactedMap((prev) => ({ ...prev, [appointmentId]: 'confirmed' }));
  };

  // Filter & Sort assessments
  const filteredAssessments = useMemo(() => {
    let result = [...assessments];

    if (riskFilter === 'CRITICAL_HIGH') {
      result = result.filter((a) => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL');
    } else if (riskFilter === 'MEDIUM') {
      result = result.filter((a) => a.riskLevel === 'MEDIUM');
    } else if (riskFilter === 'LOW') {
      result = result.filter((a) => a.riskLevel === 'LOW');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.patientName.toLowerCase().includes(q) ||
          (a.patientPhone && a.patientPhone.includes(q))
      );
    }

    if (sortBy === 'risk_desc') {
      result.sort((a, b) => b.riskScore - a.riskScore);
    } else if (sortBy === 'date_asc') {
      result.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
    }

    return result;
  }, [assessments, riskFilter, searchQuery, sortBy]);

  const lowCount = assessments.filter((a) => a.riskLevel === 'LOW').length;
  const mediumCount = assessments.filter((a) => a.riskLevel === 'MEDIUM').length;
  const highCriticalCount = assessments.filter((a) => a.riskLevel === 'HIGH' || a.riskLevel === 'CRITICAL').length;

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case 'MEDIUM':
        return <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />;
      case 'HIGH':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
      case 'CRITICAL':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    const styles = {
      LOW: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
      MEDIUM: 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
      HIGH: 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
      CRITICAL: 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800',
    };
    const style = styles[riskLevel as keyof typeof styles] || styles.LOW;
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${style}`;
  };

  const translateRecommendation = (rec: string) => {
    const match = recommendationTranslations[rec];
    if (match) {
      return isRTL ? match.ar : match.en;
    }
    return rec;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-72 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {L('جارٍ تحليل بيانات المواعيد وسجلات الحضور...', 'Analyzing appointments and patient attendance patterns...')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('تحليلات مخاطر عدم الحضور (No-Show Prediction)', 'No-Show Risk Prediction')}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {L(
              'توقع المواعيد المعرضة للتغيب، وتحليل سلوك المرضى، وإجراءات المتابعة الاستباقية لتفادي إهدار وقت العيادات',
              'Predict appointments at risk of no-show, analyze patient behavioral indicators, and execute proactive reminders'
            )}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? L('جارٍ التحديث...', 'Refreshing...') : L('تحديث البيانات', 'Refresh')}</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setRiskFilter('ALL')}
          className={`text-start p-4 sm:p-5 rounded-2xl border transition shadow-sm ${
            riskFilter === 'ALL'
              ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {L('المواعيد القادمة', 'Evaluated Appointments')}
              </p>
              <p className="text-xl font-black text-gray-900 dark:text-gray-100 mt-0.5">{totalAppointments}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setRiskFilter('LOW')}
          className={`text-start p-4 sm:p-5 rounded-2xl border transition shadow-sm ${
            riskFilter === 'LOW'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
            <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {L('منخفضة الخطورة', 'Low Risk')}
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{lowCount}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setRiskFilter('MEDIUM')}
          className={`text-start p-4 sm:p-5 rounded-2xl border transition shadow-sm ${
            riskFilter === 'MEDIUM'
              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <ExclamationTriangleIcon className="h-5 w-5" />
            </div>
            <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {L('متوسطة الخطورة', 'Medium Risk')}
              </p>
              <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{mediumCount}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setRiskFilter('CRITICAL_HIGH')}
          className={`text-start p-4 sm:p-5 rounded-2xl border transition shadow-sm ${
            riskFilter === 'CRITICAL_HIGH'
              ? 'bg-red-50/70 dark:bg-red-950/30 border-red-300 dark:border-red-700 ring-2 ring-red-500/20'
              : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
              <XCircleIcon className="h-5 w-5" />
            </div>
            <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {L('عالية أو حرجة', 'High / Critical')}
              </p>
              <p className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">{highCriticalCount}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <MagnifyingGlassIcon className={`h-4 w-4 absolute top-3 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={L('بحث بالاسم أو رقم الهاتف...', 'Search by patient name or phone...')}
            className={`w-full text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 focus:ring-primary-500 focus:border-primary-500 ${
              isRTL ? 'pr-9' : 'pl-9'
            }`}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRiskFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              riskFilter === 'ALL'
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {L('الكل', 'All')} ({assessments.length})
          </button>
          <button
            onClick={() => setRiskFilter('CRITICAL_HIGH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              riskFilter === 'CRITICAL_HIGH'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100'
            }`}
          >
            {L('عالي وحرج', 'High & Critical')} ({highCriticalCount})
          </button>
          <button
            onClick={() => setRiskFilter('MEDIUM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              riskFilter === 'MEDIUM'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
            }`}
          >
            {L('متوسط', 'Medium')} ({mediumCount})
          </button>
          <button
            onClick={() => setRiskFilter('LOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              riskFilter === 'LOW'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            {L('منخفض', 'Low')} ({lowCount})
          </button>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="risk_desc">{L('الأعلى خطورة أولاً', 'Highest Risk First')}</option>
          <option value="date_asc">{L('الأقرب موعداً أولاً', 'Soonest Date First')}</option>
        </select>
      </div>

      {/* Appointments List */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {L('نتائج الفحص والتقييم التنبؤي للمواعيد', 'Predictive Assessment & Interventions')}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {filteredAssessments.length}
            </span>
          </div>
        </div>

        {filteredAssessments.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {L('لا توجد مواعيد مطابقة لمعايير البحث الحالية', 'No appointments match the current criteria')}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {L('جرب تغيير خيارات التصفية أو إفراغ خانة البحث.', 'Try changing filter options or clearing the search query.')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredAssessments.map((appointment) => {
              const contactStatus = contactedMap[appointment.appointmentId];
              return (
                <div
                  key={appointment.appointmentId}
                  className="p-5 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition space-y-4"
                >
                  {/* Row Top: Info & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="mt-1">{getRiskIcon(appointment.riskLevel)}</div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {appointment.patientName}
                          </h4>
                          <span className={getRiskBadge(appointment.riskLevel)}>
                            {appointment.riskLevel === 'CRITICAL' ? L('حرج', 'Critical') : 
                             appointment.riskLevel === 'HIGH' ? L('عالي', 'High') : 
                             appointment.riskLevel === 'MEDIUM' ? L('متوسط', 'Medium') : L('منخفض', 'Low')}
                          </span>
                          {contactStatus === 'whatsapp' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <CheckIcon className="w-3 h-3" />
                              {L('أرسل تذكير واتساب', 'WhatsApp Sent')}
                            </span>
                          )}
                          {contactStatus === 'phone' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                              <CheckIcon className="w-3 h-3" />
                              {L('تم الاتصال هاتفياً', 'Phone Called')}
                            </span>
                          )}
                          {contactStatus === 'confirmed' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                              <CheckIcon className="w-3 h-3" />
                              {L('مؤكد من المريض', 'Confirmed')}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                          <span>📅 {new Date(appointment.appointmentDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          <span>⏰ {new Date(appointment.appointmentDate).toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                          {appointment.patientPhone && (
                            <span className="hidden sm:inline">📞 {appointment.patientPhone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      {/* WhatsApp Button */}
                      <button
                        onClick={() => handleSendWhatsApp(appointment)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                        title={L('إرسال تذكير واتساب تلقائي', 'Send WhatsApp Reminder')}
                      >
                        <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                        <span>{L('واتساب', 'WhatsApp')}</span>
                      </button>

                      {/* Phone Call Button */}
                      <button
                        onClick={() => handleCallPatient(appointment)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                        title={L('اتصال هاتفياً', 'Call Patient')}
                      >
                        <PhoneIcon className="w-4 h-4" />
                        <span>{L('اتصال', 'Call')}</span>
                      </button>

                      {/* Confirm attendance button */}
                      <button
                        onClick={() => handleMarkConfirmed(appointment.appointmentId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition"
                        title={L('تأكيد الحضور', 'Mark Confirmed')}
                      >
                        <CheckIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{L('تأكيد', 'Confirm')}</span>
                      </button>

                      {/* View Profile */}
                      <button
                        onClick={() => handleViewPatientProfile(appointment.patientId)}
                        className="p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
                        title={L('سجل وسلوك المريض', 'Patient Risk Profile')}
                      >
                        <UserIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Risk Factors Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/70">
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{L('درجة المخاطرة:', 'Risk Score:')}</p>
                      <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                        {appointment.riskScore} <span className="text-[10px] font-normal text-gray-400">/ 100</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{L('عدم حضور سابق:', 'No-Show History:')}</p>
                      <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                        {appointment.riskFactors?.patientNoShowHistory || 0} {L('مرات', 'times')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{L('إلغاء سابق:', 'Past Cancellations:')}</p>
                      <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                        {appointment.riskFactors?.patientCancellationHistory || 0} {L('مرات', 'times')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">{L('رصيد مستحق:', 'Outstanding Balance:')}</p>
                      <p className="font-extrabold text-sm text-gray-900 dark:text-gray-100 mt-0.5">
                        {appointment.riskFactors?.outstandingBalance || 0} EGP
                      </p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  {appointment.recommendations && appointment.recommendations.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-gray-600 dark:text-gray-300 text-[11px]">
                        💡 {L('توصيات التدخل:', 'Actions:')}
                      </span>
                      {appointment.recommendations.map((rec: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50"
                        >
                          {translateRecommendation(rec)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Patient Profile Modal */}
      {selectedPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/40">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary-600" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {L('الملف السلوكي ومخاطر عدم الحضور للمريض', 'Patient No-Show & Attendance Profile')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  setPatientProfile(null);
                }}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {loadingProfile ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : patientProfile ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-extrabold text-gray-900 dark:text-gray-100">{patientProfile.patientName}</h4>
                    <span className={getRiskBadge(patientProfile.riskLevel)}>
                      {L('مستوى المخاطرة العام:', 'Overall Risk:')} {patientProfile.riskLevel} ({patientProfile.overallRiskScore}/100)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 block">{L('إجمالي المواعيد', 'Total Appointments')}</span>
                      <strong className="text-base font-bold text-gray-900 dark:text-gray-100">{patientProfile.totalAppointments}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 block">{L('نسبة اكتمال الجلسات', 'Completion Rate')}</span>
                      <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.round(patientProfile.completionRate || 0)}%
                      </strong>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 block">{L('مرات عدم الحضور', 'No-Show Count')}</span>
                      <strong className="text-base font-bold text-red-600 dark:text-red-400">{patientProfile.noShowCount}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                      <span className="text-gray-500 dark:text-gray-400 block">{L('مرات الإلغاء', 'Cancellations')}</span>
                      <strong className="text-base font-bold text-amber-600 dark:text-amber-400">{patientProfile.cancellationCount}</strong>
                    </div>
                  </div>

                  {patientProfile.outstandingBalance > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200">
                      <span className="font-bold">{L('رصيد فواتير غير مدفوعة: ', 'Unpaid Invoices: ')}</span>
                      <span>{patientProfile.outstandingBalance} EGP</span>
                    </div>
                  )}

                  {patientProfile.recommendations && patientProfile.recommendations.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                        {L('إرشادات موظفي الاستقبال لهذا المريض:', 'Reception Guidelines:')}
                      </span>
                      <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        {patientProfile.recommendations.map((r: string, i: number) => (
                          <li key={i}>{translateRecommendation(r)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center">{L('تعذر تحميل بيانات المريض', 'Failed to load profile')}</p>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => {
                  setSelectedPatientId(null);
                  setPatientProfile(null);
                }}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {L('إغلاق', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoShowRiskDashboard;
