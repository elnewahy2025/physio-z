import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Building2,
  FileText,
  Calculator,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Printer,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useI18n } from '../../../i18n';
import {
  insuranceService,
  InsuranceClaim,
  InsuranceProvider,
} from '../services/insurance.service';

const InsuranceManagementPage: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);
  const queryClient = useQueryClient();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'claims' | 'preauth' | 'calculator' | 'providers'>('claims');

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [providerFilter, setProviderFilter] = useState<string>('ALL');

  // Modals
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);
  const [selectedClaimForStatus, setSelectedClaimForStatus] = useState<InsuranceClaim | null>(null);
  const [selectedClaimForPrint, setSelectedClaimForPrint] = useState<InsuranceClaim | null>(null);
  const [isNewProviderOpen, setIsNewProviderOpen] = useState(false);

  // New Claim Form State
  const [claimForm, setClaimForm] = useState({
    patientName: '',
    patientPhone: '',
    providerId: '',
    diagnosisCode: 'M54.5',
    treatmentDescription: '',
    totalAmount: 450,
    status: 'SUBMITTED',
    preAuthCode: '',
    notes: '',
  });

  // Status Change Form State
  const [statusForm, setStatusForm] = useState({
    status: 'APPROVED',
    preAuthCode: '',
    rejectionReason: '',
    notes: '',
  });

  // Interactive Calculator State
  const [calcAmount, setCalcAmount] = useState<number>(500);
  const [calcProviderId, setCalcProviderId] = useState<string>('');
  const [calcCustomCoverage, setCalcCustomCoverage] = useState<number>(80);
  const [calcFixedCopay, setCalcFixedCopay] = useState<number>(0);

  // New Provider Form State
  const [providerForm, setProviderForm] = useState({
    name: '',
    nameAr: '',
    code: '',
    contactEmail: '',
    contactPhone: '',
    portalUrl: '',
    claimSubmissionType: 'PORTAL',
    defaultCopayPct: 20,
  });

  // Queries
  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['insurance-providers'],
    queryFn: () => insuranceService.getProviders(),
  });

  const { data: claims = [], isLoading: loadingClaims } = useQuery({
    queryKey: ['insurance-claims', statusFilter, providerFilter, searchQuery],
    queryFn: () =>
      insuranceService.getClaims({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        providerId: providerFilter === 'ALL' ? undefined : providerFilter,
        search: searchQuery || undefined,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['insurance-stats'],
    queryFn: () => insuranceService.getStats(),
  });

  // Mutations
  const createClaimMutation = useMutation({
    mutationFn: (newClaim: any) => insuranceService.createClaim(newClaim),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      queryClient.invalidateQueries({ queryKey: ['insurance-stats'] });
      setIsNewClaimOpen(false);
      setClaimForm({
        patientName: '',
        patientPhone: '',
        providerId: '',
        diagnosisCode: 'M54.5',
        treatmentDescription: '',
        totalAmount: 450,
        status: 'SUBMITTED',
        preAuthCode: '',
        notes: '',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      insuranceService.updateClaimStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-claims'] });
      queryClient.invalidateQueries({ queryKey: ['insurance-stats'] });
      setSelectedClaimForStatus(null);
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: (newProv: any) => insuranceService.createProvider(newProv),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insurance-providers'] });
      setIsNewProviderOpen(false);
      setProviderForm({
        name: '',
        nameAr: '',
        code: '',
        contactEmail: '',
        contactPhone: '',
        portalUrl: '',
        claimSubmissionType: 'PORTAL',
        defaultCopayPct: 20,
      });
    },
  });

  // Calculator computations
  const calculatedBreakdown = useMemo(() => {
    let coveragePct = calcCustomCoverage;
    if (calcProviderId) {
      const p = providers.find((x) => x.id === calcProviderId);
      if (p) {
        coveragePct = 100 - Number(p.defaultCopayPct);
      }
    }
    const patientPercentageCost = (calcAmount * (100 - coveragePct)) / 100;
    const patientCopay = Math.min(calcAmount, patientPercentageCost + Number(calcFixedCopay));
    const coveredAmount = Math.max(0, calcAmount - patientCopay);
    return {
      coveragePct,
      copayPct: 100 - coveragePct,
      coveredAmount: Math.round(coveredAmount),
      patientCopay: Math.round(patientCopay),
    };
  }, [calcAmount, calcProviderId, calcCustomCoverage, calcFixedCopay, providers]);

  // Pre-authorization filtered claims
  const preAuthClaims = useMemo(() => {
    return claims.filter((c) => c.status === 'PRE_AUTH_PENDING');
  }, [claims]);

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {L('تمت الموافقة', 'Approved')}
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <CreditCard className="w-3.5 h-3.5" />
            {L('تم السداد', 'Paid')}
          </span>
        );
      case 'PRE_AUTH_PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            {L('بانتظار الموافقة المسبقة', 'Pre-Auth Pending')}
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <FileText className="w-3.5 h-3.5" />
            {L('مرفوعة للمطالبة', 'Submitted')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            {L('مرفوضة', 'Rejected')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <Clock className="w-3.5 h-3.5" />
            {L('مسودة', 'Draft')}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8 transition-colors duration-200">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span>{L('وحدة التأمين والمطالبات الطبية', 'Medical Insurance & Claims System')}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {L('إدارة التأمين والمطالبات والتحمل', 'Insurance & Claims Management')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {L(
              'تسجيل وتتبع مطالبات شركات التأمين، إدارة الموافقات المسبقة، وحساب نسبة التحمل بدقة',
              'Track insurance claims, manage pre-authorizations, and calculate patient co-pays accurately.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewClaimOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm shadow-emerald-600/30 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{L('مطالبة جديدة', 'New Insurance Claim')}</span>
          </button>
        </div>
      </div>

      {/* ─── KPI METRICS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Billed */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {L('إجمالي المطالبات', 'Total Claims Billed')}
            </p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {(stats?.totalBilled || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">EGP</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats?.totalClaims || 0} {L('مطالبة مسجلة', 'claims filed')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Covered Amount */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {L('تغطية التأمين المحققة', 'Insurance Covered Amount')}
            </p>
            <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {(stats?.totalCovered || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">EGP</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats?.approvedCount || 0} {L('مطالبة معتمدة', 'approved')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Pre-Auth */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {L('موافقات مسبقة معلقة', 'Pending Pre-Auths')}
            </p>
            <p className="text-2xl font-bold mt-1 text-amber-500 dark:text-amber-400">
              {stats?.pendingPreAuthCount || 0}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              {stats?.pendingPreAuthCount ? L('تتطلب استكمال الكود', 'Action required') : L('لا يوجد معلق', 'All cleared')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 dark:text-amber-400 border border-amber-100 dark:border-amber-900">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Rejection Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {L('معدل الرفض', 'Denial / Rejection Rate')}
            </p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {stats?.rejectionRate || 0}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats?.rejectedCount || 0} {L('مطالبة مرفوضة', 'denied claims')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-900">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('claims')}
          className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'claims'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-bold'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{L('سجل المطالبات', 'Claims Tracker')}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {claims.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('preauth')}
          className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'preauth'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400 font-bold'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{L('الموافقات المسبقة المعلقة', 'Pre-Authorization Queue')}</span>
          {preAuthClaims.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 font-bold">
              {preAuthClaims.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('calculator')}
          className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'calculator'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-bold'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>{L('حاسبة التغطية والتحمل (Co-Pay)', 'Coverage & Co-Pay Calculator')}</span>
        </button>

        <button
          onClick={() => setActiveTab('providers')}
          className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'providers'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400 font-bold'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{L('شركات التأمين المعتمدة', 'Insurance Providers')}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {providers.length}
          </span>
        </button>
      </div>

      {/* ─── TAB CONTENT ─── */}

      {/* 1. CLAIMS TRACKER */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute top-3.5 start-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={L('بحث برقم المطالبة أو المريض...', 'Search by claim # or patient...')}
                className="w-full ps-9 pe-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">{L('جميع الشركات', 'All Providers')}</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isRTL ? p.nameAr : p.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">{L('جميع الحالات', 'All Statuses')}</option>
                <option value="PRE_AUTH_PENDING">{L('بانتظار الموافقة المسبقة', 'Pre-Auth Pending')}</option>
                <option value="SUBMITTED">{L('مرفوعة للمطالبة', 'Submitted')}</option>
                <option value="APPROVED">{L('معتمدة', 'Approved')}</option>
                <option value="PAID">{L('مسددة', 'Paid')}</option>
                <option value="REJECTED">{L('مرفوضة', 'Rejected')}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {loadingClaims ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-emerald-600" />
                <p>{L('جاري تحميل سجل المطالبات...', 'Loading claims records...')}</p>
              </div>
            ) : claims.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
                  {L('لا توجد مطالبات تأمين مطابقة', 'No insurance claims found')}
                </h3>
                <p className="text-sm mt-1">
                  {L('قم بإنشاء مطالبة جديدة لخدمات المريض أو قم بتغيير معايير البحث.', 'Create a new claim for patient services or adjust search filters.')}
                </p>
                <button
                  onClick={() => setIsNewClaimOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold"
                >
                  {L('إنشاء أول مطالبة', 'Create First Claim')}
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-5 py-3 text-start">{L('رقم المطالبة والتاريخ', 'Claim # & Date')}</th>
                      <th className="px-5 py-3 text-start">{L('المريض', 'Patient')}</th>
                      <th className="px-5 py-3 text-start">{L('شركة التأمين', 'Insurance Provider')}</th>
                      <th className="px-5 py-3 text-start">{L('الخدمة والتشخيص', 'Service & Diagnosis')}</th>
                      <th className="px-5 py-3 text-start">{L('المبالغ (إجمالي / تأمين / تحمل)', 'Amounts (Total / Ins / Copay)')}</th>
                      <th className="px-5 py-3 text-start">{L('الحالة', 'Status')}</th>
                      <th className="px-5 py-3 text-end">{L('الإجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {claim.claimNumber}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(claim.serviceDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}
                          </p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {claim.patient?.name || L('مريض مسجل', 'Registered Patient')}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {claim.patient?.phone}
                          </p>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            <Building2 className="w-3.5 h-3.5 text-gray-500" />
                            {isRTL ? claim.provider?.nameAr : claim.provider?.name}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                            {claim.treatmentDescription}
                          </p>
                          {claim.diagnosisCode && (
                            <span className="text-xs text-gray-400 font-mono">
                              ICD: {claim.diagnosisCode}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              {Number(claim.totalAmount).toLocaleString()} EGP
                            </span>
                          </div>
                          <div className="text-xs flex items-center gap-2 mt-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {L('تأمين', 'Ins')}: {Number(claim.coveredAmount).toLocaleString()}
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">|</span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              {L('تحمل', 'Copay')}: {Number(claim.patientCopayAmount).toLocaleString()}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          {renderStatusBadge(claim.status)}
                          {claim.preAuthCode && (
                            <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mt-1">
                              Ref: {claim.preAuthCode}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedClaimForStatus(claim);
                                setStatusForm({
                                  status: claim.status,
                                  preAuthCode: claim.preAuthCode || '',
                                  rejectionReason: claim.rejectionReason || '',
                                  notes: claim.notes || '',
                                });
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-all"
                            >
                              {L('تحديث الحالة', 'Status')}
                            </button>

                            <button
                              onClick={() => setSelectedClaimForPrint(claim)}
                              className="p-1.5 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
                              title={L('معاينة الإيصال للطباعة', 'Print Claim Voucher')}
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. PRE-AUTHORIZATION QUEUE */}
      {activeTab === 'preauth' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800/80 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                {L('طابور الموافقات المسبقة لشركات التأمين', 'Insurance Pre-Authorization Action Queue')}
              </h3>
              <p className="text-amber-800 dark:text-amber-300 text-xs mt-1">
                {L(
                  'الجلسات والبروتوكولات التي تتطلب موافقة كتابية أو كود تفويض من شركة التأمين قبل بدء العلاج لتفادي رفض المطالبة لاحقاً.',
                  'Treatments that require written insurance pre-approval or authorization code before therapy begins to avoid denied claims.'
                )}
              </p>
            </div>
          </div>

          {preAuthClaims.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-base text-gray-800 dark:text-gray-200">
                {L('لا توجد موافقات مسبقة معلقة حالياً', 'No Pending Pre-Authorizations')}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {L('جميع جلسات المرضى التأمينية معتمدة ومحدثة بالأكواد الرسمية.', 'All insured patient sessions are approved with verified authorization codes.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preAuthClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {claim.claimNumber}
                      </span>
                      <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 mt-0.5">
                        {claim.patient?.name}
                      </h4>
                      <p className="text-xs text-gray-400 font-mono">{claim.patient?.phone}</p>
                    </div>
                    {renderStatusBadge(claim.status)}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/40 p-3 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{L('الشركة:', 'Provider:')}</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {isRTL ? claim.provider?.nameAr : claim.provider?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{L('الخدمة:', 'Treatment:')}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                        {claim.treatmentDescription}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">{L('المبلغ المطلوب:', 'Claim Total:')}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(claim.totalAmount).toLocaleString()} EGP
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedClaimForStatus(claim);
                        setStatusForm({
                          status: 'APPROVED',
                          preAuthCode: '',
                          rejectionReason: '',
                          notes: '',
                        });
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                    >
                      {L('تسجيل كود الموافقة', 'Enter Pre-Auth Code')}
                    </button>
                    {claim.provider?.portalUrl && (
                      <a
                        href={claim.provider.portalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-all"
                        title={L('فتح بوابة التأمين', 'Open Provider Portal')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. COVERAGE & COPAY CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">
                  {L('حاسبة نسبة التحمل وتغطية التأمين الفورية', 'Instant Co-Pay & Coverage Calculator')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {L('احسب التكلفة للمريض والشركة قبل حجز الجلسة بضغطة زر', 'Calculate patient out-of-pocket and insurer share before booking.')}
                </p>
              </div>
            </div>

            {/* Session Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {L('سعر الجلسة / الباقة (جنيه مصري)', 'Session / Package Total Price (EGP)')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 text-lg font-bold rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute end-3.5 top-3 text-xs font-semibold text-gray-400">
                  EGP
                </span>
              </div>
            </div>

            {/* Provider Selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {L('اختر شركة التأمين أو حدد النسبة يدوياً', 'Insurance Provider or Custom Rate')}
              </label>
              <select
                value={calcProviderId}
                onChange={(e) => setCalcProviderId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{L('— تحديد نسبة مخصصة يدوياً —', '— Custom Rate Specification —')}</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {isRTL ? p.nameAr : p.name} ({L('تحمل', 'Copay')} {Number(p.defaultCopayPct)}%)
                  </option>
                ))}
              </select>
            </div>

            {!calcProviderId && (
              <div>
                <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  <span>{L('نسبة تغطية التأمين:', 'Insurance Coverage Percentage:')}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{calcCustomCoverage}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={calcCustomCoverage}
                  onChange={(e) => setCalcCustomCoverage(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1 font-mono">
                  <span>10%</span>
                  <span>50%</span>
                  <span>80%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Fixed Copay */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {L('مبلغ تحمل إضافي ثابت (إن وجد)', 'Fixed Additional Co-Pay Amount (Optional EGP)')}
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={calcFixedCopay}
                onChange={(e) => setCalcFixedCopay(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Results Visual Display */}
          <div className="lg:col-span-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {L('تفصيل التكلفة المالية للخدمة', 'Cost Sharing Breakdown')}
              </h4>

              {/* Meter bar */}
              <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex my-4">
                <div
                  style={{ width: `${calculatedBreakdown.coveragePct}%` }}
                  className="bg-emerald-600 dark:bg-emerald-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300"
                >
                  {calculatedBreakdown.coveragePct >= 20 ? `${calculatedBreakdown.coveragePct}%` : ''}
                </div>
                <div
                  style={{ width: `${calculatedBreakdown.copayPct}%` }}
                  className="bg-blue-600 dark:bg-blue-500 h-full flex items-center justify-center text-xs font-bold text-white transition-all duration-300"
                >
                  {calculatedBreakdown.copayPct >= 20 ? `${calculatedBreakdown.copayPct}%` : ''}
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                {/* Insurance Share */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{L('تتحمله شركة التأمين', 'Insurance Pays')}</span>
                  </div>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                    {calculatedBreakdown.coveredAmount.toLocaleString()} <span className="text-xs font-normal">EGP</span>
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                    {calculatedBreakdown.coveragePct}% {L('من إجمالي السعر', 'of total')}
                  </p>
                </div>

                {/* Patient Share */}
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60">
                  <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-xs mb-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{L('يسدده المريض (كاش / كارت)', 'Patient Pays (Co-Pay)')}</span>
                  </div>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-400">
                    {calculatedBreakdown.patientCopay.toLocaleString()} <span className="text-xs font-normal">EGP</span>
                  </p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                    {calculatedBreakdown.copayPct}% {L('نسبة التحمل', 'co-pay share')}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => {
                setClaimForm((prev) => ({
                  ...prev,
                  totalAmount: calcAmount,
                  providerId: calcProviderId || prev.providerId,
                }));
                setIsNewClaimOpen(true);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{L('إنشاء مطالبة بهذه الحسبة المالية', 'Generate Claim from this Calculation')}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. INSURANCE PROVIDERS DIRECTORY */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">
              {L('دليل شركات وهيئات التأمين المعتمدة بالمركز', 'Registered Insurance Providers & TPAs')}
            </h3>
            <button
              onClick={() => setIsNewProviderOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{L('إضافة شركة تأمين', 'Add Insurance Provider')}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm space-y-3 relative hover:border-emerald-500 dark:hover:border-emerald-500 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-gray-100">
                      {isRTL ? p.nameAr : p.name}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{p.code}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {L('تحمل', 'Copay')} {Number(p.defaultCopayPct)}%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  {p.contactPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{L('الهاتف:', 'Phone:')}</span>
                      <span className="font-mono font-medium">{p.contactPhone}</span>
                    </div>
                  )}
                  {p.contactEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">{L('البريد:', 'Email:')}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">{p.contactEmail}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">{L('طريقة التقديم:', 'Submission:')}</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{p.claimSubmissionType}</span>
                  </div>
                </div>

                {p.portalUrl && (
                  <a
                    href={p.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center justify-center gap-1.5 w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-semibold transition-all"
                  >
                    <span>{L('الدخول لبوابة المطالبات', 'Open Claims Portal')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL: NEW CLAIM ─── */}
      {isNewClaimOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {L('إنشاء مطالبة تأمين جديدة', 'Create New Insurance Claim')}
              </h3>
              <button
                onClick={() => setIsNewClaimOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!claimForm.providerId) return;
                // Quick patient lookup/mock or first provider
                createClaimMutation.mutate({
                  patientId: 'patient_sample_id', // Mock or selected
                  providerId: claimForm.providerId,
                  serviceDate: new Date().toISOString(),
                  diagnosisCode: claimForm.diagnosisCode,
                  treatmentDescription: claimForm.treatmentDescription || 'جلسة علاج طبيعي وتأهيل حركي',
                  totalAmount: Number(claimForm.totalAmount),
                  status: claimForm.status,
                  preAuthCode: claimForm.preAuthCode || undefined,
                  notes: claimForm.notes,
                });
              }}
              className="space-y-4 text-sm"
            >
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {L('شركة التأمين *', 'Insurance Provider *')}
                </label>
                <select
                  required
                  value={claimForm.providerId}
                  onChange={(e) => setClaimForm({ ...claimForm, providerId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{L('— اختر شركة التأمين —', '— Select Insurance Provider —')}</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {isRTL ? p.nameAr : p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {L('اسم المريض', 'Patient Name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={claimForm.patientName}
                    onChange={(e) => setClaimForm({ ...claimForm, patientName: e.target.value })}
                    placeholder={L('أحمد محمد...', 'Ahmed Mohamed...')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {L('رقم الهاتف', 'Patient Phone')}
                  </label>
                  <input
                    type="text"
                    value={claimForm.patientPhone}
                    onChange={(e) => setClaimForm({ ...claimForm, patientPhone: e.target.value })}
                    placeholder="+20 100 000 0000"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Service & ICD Code */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {L('وصف العلاج والخدمة *', 'Treatment Description *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={claimForm.treatmentDescription}
                    onChange={(e) => setClaimForm({ ...claimForm, treatmentDescription: e.target.value })}
                    placeholder={L('جلسة تأهيل غضروف الركبة + ليزر بارد', 'Knee Rehab Session + Modalities')}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {L('كود التشخيص', 'ICD Code')}
                  </label>
                  <input
                    type="text"
                    value={claimForm.diagnosisCode}
                    onChange={(e) => setClaimForm({ ...claimForm, diagnosisCode: e.target.value })}
                    placeholder="M54.5"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Total Amount */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {L('إجمالي تكلفة الخدمة (EGP) *', 'Total Service Fee (EGP) *')}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={claimForm.totalAmount}
                  onChange={(e) => setClaimForm({ ...claimForm, totalAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              {/* Pre Auth Code & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {L('كود الموافقة المسبقة (إن وجد)', 'Pre-Auth Code (Optional)')}
                  </label>
                  <input
                    type="text"
                    value={claimForm.preAuthCode}
                    onChange={(e) => setClaimForm({ ...claimForm, preAuthCode: e.target.value })}
                    placeholder="AUTH-99482"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {L('الحالة الابتدائية للمطالبة', 'Initial Status')}
                  </label>
                  <select
                    value={claimForm.status}
                    onChange={(e) => setClaimForm({ ...claimForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="SUBMITTED">{L('مرفوعة للمطالبة (Submitted)', 'Submitted')}</option>
                    <option value="PRE_AUTH_PENDING">{L('بانتظار الموافقة المسبقة', 'Pre-Auth Pending')}</option>
                    <option value="APPROVED">{L('معتمدة مسبقاً (Approved)', 'Approved')}</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewClaimOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {L('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createClaimMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  {createClaimMutation.isPending ? L('جاري الحفظ...', 'Saving...') : L('حفظ المطالبة', 'Submit Claim')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: UPDATE STATUS ─── */}
      {selectedClaimForStatus && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  {L('تحديث حالة المطالبة', 'Update Claim Status')}
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                  {selectedClaimForStatus.claimNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedClaimForStatus(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateStatusMutation.mutate({
                  id: selectedClaimForStatus.id,
                  data: statusForm,
                });
              }}
              className="space-y-4 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {L('الحالة الجديدة', 'New Status')}
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PRE_AUTH_PENDING">{L('بانتظار الموافقة المسبقة', 'Pre-Auth Pending')}</option>
                  <option value="SUBMITTED">{L('مرفوعة للمطالبة', 'Submitted')}</option>
                  <option value="APPROVED">{L('معتمدة (Approved)', 'Approved')}</option>
                  <option value="PAID">{L('مسددة (Paid by Insurance)', 'Paid')}</option>
                  <option value="REJECTED">{L('مرفوضة (Rejected)', 'Rejected')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {L('كود الموافقة / رقم التفويض', 'Pre-Auth Approval Code')}
                </label>
                <input
                  type="text"
                  value={statusForm.preAuthCode}
                  onChange={(e) => setStatusForm({ ...statusForm, preAuthCode: e.target.value })}
                  placeholder="e.g. AXA-AUTH-88129"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {statusForm.status === 'REJECTED' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-rose-600 dark:text-rose-400">
                    {L('سبب الرفض من شركة التأمين', 'Insurance Rejection Reason')}
                  </label>
                  <textarea
                    rows={2}
                    value={statusForm.rejectionReason}
                    onChange={(e) => setStatusForm({ ...statusForm, rejectionReason: e.target.value })}
                    placeholder={L('تجاوز الحد السنوي / بحاجة لتقرير طبي إضافي', 'Annual limit exceeded / Needs medical report')}
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClaimForStatus(null)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {L('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  {updateStatusMutation.isPending ? L('جاري التحديث...', 'Updating...') : L('تأكيد التحديث', 'Confirm Update')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: PRINT CLAIM VOUCHER ─── */}
      {selectedClaimForPrint && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  {L('إيصال مطالبة التأمين الطبي', 'Insurance Claim Voucher')}
                </h3>
              </div>
              <button
                onClick={() => setSelectedClaimForPrint(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Voucher Paper */}
            <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 font-sans space-y-4 text-xs">
              <div className="flex justify-between items-start border-b pb-3 border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="font-black text-sm text-gray-900 dark:text-gray-100">
                    {L('مركز فيزيو-زد للعلاج الطبيعي والتأهيل', 'Physio-Z Rehabilitation Center')}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                    {L('قسيمة مطالبة تأمينية معتمدة', 'Official Medical Insurance Voucher')}
                  </p>
                </div>
                <div className="text-end">
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedClaimForPrint.claimNumber}
                  </p>
                  <p className="text-gray-400">
                    {new Date(selectedClaimForPrint.serviceDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-400 block">{L('المريض:', 'Patient:')}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                    {selectedClaimForPrint.patient?.name}
                  </span>
                  <span className="block font-mono text-gray-400">{selectedClaimForPrint.patient?.phone}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">{L('جهة التأمين:', 'Insurance Payer:')}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                    {isRTL ? selectedClaimForPrint.provider?.nameAr : selectedClaimForPrint.provider?.name}
                  </span>
                  <span className="block font-mono text-gray-400">
                    {selectedClaimForPrint.preAuthCode ? `Pre-Auth: ${selectedClaimForPrint.preAuthCode}` : 'Standard Claim'}
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">{L('الخدمة العلاجية:', 'Service Description:')}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedClaimForPrint.treatmentDescription}
                  </span>
                </div>
                {selectedClaimForPrint.diagnosisCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">{L('كود التشخيص (ICD):', 'Diagnosis Code:')}</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">
                      {selectedClaimForPrint.diagnosisCode}
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Split Breakdown */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1.5">
                <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100 text-sm">
                  <span>{L('إجمالي المطالبة:', 'Total Claim Amount:')}</span>
                  <span>{Number(selectedClaimForPrint.totalAmount).toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>{L('حصة شركة التأمين (المغطى):', 'Covered by Insurance:')}</span>
                  <span>{Number(selectedClaimForPrint.coveredAmount).toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between text-blue-600 dark:text-blue-400 font-semibold">
                  <span>{L('نسبة تحمل المريض (Co-Pay):', 'Patient Co-Pay:')}</span>
                  <span>{Number(selectedClaimForPrint.patientCopayAmount).toLocaleString()} EGP</span>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-gray-300 dark:border-gray-700 flex justify-between text-gray-400 text-center">
                <div>
                  <div className="h-8"></div>
                  <p>{L('توقيع المريض / المشترك', 'Patient Signature')}</p>
                </div>
                <div>
                  <div className="h-8"></div>
                  <p>{L('ختم وتوقيع المركز الطبي', 'Clinic Stamp & Signature')}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedClaimForPrint(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold"
              >
                {L('إغلاق', 'Close')}
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>{L('طباعة الإيصال', 'Print Voucher')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: NEW PROVIDER ─── */}
      {isNewProviderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                {L('إضافة شركة تأمين معتمدة', 'Add Insurance Provider')}
              </h3>
              <button
                onClick={() => setIsNewProviderOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createProviderMutation.mutate({
                  ...providerForm,
                  defaultCopayPct: Number(providerForm.defaultCopayPct),
                });
              }}
              className="space-y-3 text-sm"
            >
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {L('اسم الشركة (إنجليزي) *', 'Provider Name (English) *')}
                </label>
                <input
                  type="text"
                  required
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  placeholder="e.g. Allianz Egypt"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {L('اسم الشركة (عربي) *', 'Provider Name (Arabic) *')}
                </label>
                <input
                  type="text"
                  required
                  value={providerForm.nameAr}
                  onChange={(e) => setProviderForm({ ...providerForm, nameAr: e.target.value })}
                  placeholder="مثال: أليانز مصر للتأمين"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {L('رمز الشركة (Code) *', 'Provider Code *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={providerForm.code}
                    onChange={(e) => setProviderForm({ ...providerForm, code: e.target.value.toUpperCase() })}
                    placeholder="ALLIANZ_EG"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                    {L('نسبة التحمل الافتراضية (%)', 'Default Copay (%)')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={providerForm.defaultCopayPct}
                    onChange={(e) => setProviderForm({ ...providerForm, defaultCopayPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                  {L('رابط بوابة المطالبات (Portal URL)', 'Portal URL')}
                </label>
                <input
                  type="url"
                  value={providerForm.portalUrl}
                  onChange={(e) => setProviderForm({ ...providerForm, portalUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProviderOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold"
                >
                  {L('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createProviderMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {createProviderMutation.isPending ? L('جاري الحفظ...', 'Saving...') : L('إضافة الشركة', 'Save Provider')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceManagementPage;
