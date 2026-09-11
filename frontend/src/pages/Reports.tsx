// frontend/src/pages/Reports.tsx
import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Calendar,
  DollarSign,
  Users,
  Activity,
  MapPin,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  MessageSquare,
  Clock,
  Check,
  XCircle,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import api from '../lib/api';
import { useI18n } from '../i18n';
import {
  Card,
  CardHeader,
  StatCard,
  EmptyState,
  Spinner,
  Badge,
} from '../components/ui';
import { StarRating } from '../components/StarRating';

const COLORS = [
  '#2563eb',
  '#16a34a',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#be185d',
];

type ReportTab =
  | 'financial'
  | 'outstanding'
  | 'therapists'
  | 'patients'
  | 'appointments'
  | 'rooms'
  | 'tax'
  | 'pl'
  | 'surveys';

export default function Reports() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const reportRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(
    startOfMonth.toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(
    today.toISOString().split('T')[0],
  );
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const params = useMemo(
    () => ({ startDate, endDate }),
    [startDate, endDate],
  );

  // ─── Fetch report data based on active tab ───
  const { data: financialData, isLoading: finLoading } = useQuery({
    queryKey: ['report-financial', params],
    queryFn: async () => {
      const res = await api.get('/reports/financial', { params });
      return res.data;
    },
    enabled: activeTab === 'financial',
  });

  const { data: outstandingData, isLoading: outLoading } = useQuery({
    queryKey: ['report-outstanding'],
    queryFn: async () => {
      const res = await api.get('/reports/outstanding');
      return res.data;
    },
    enabled: activeTab === 'outstanding',
  });

  const { data: therapistData, isLoading: thLoading } = useQuery({
    queryKey: ['report-therapists', params],
    queryFn: async () => {
      const res = await api.get('/reports/therapists', { params });
      return res.data;
    },
    enabled: activeTab === 'therapists',
  });

  const { data: patientData, isLoading: patLoading } = useQuery({
    queryKey: ['report-patients', params],
    queryFn: async () => {
      const res = await api.get('/reports/patients', { params });
      return res.data;
    },
    enabled: activeTab === 'patients',
  });

  const { data: appointmentData, isLoading: apptLoading } = useQuery({
    queryKey: ['report-appointments', params],
    queryFn: async () => {
      const res = await api.get('/reports/appointments', { params });
      return res.data;
    },
    enabled: activeTab === 'appointments',
  });

  const { data: roomData, isLoading: roomLoading } = useQuery({
    queryKey: ['report-rooms', params],
    queryFn: async () => {
      const res = await api.get('/reports/rooms', { params });
      return res.data;
    },
    enabled: activeTab === 'rooms',
  });

  const { data: taxData, isLoading: taxLoading } = useQuery({
    queryKey: ['report-tax', params],
    queryFn: async () => {
      const res = await api.get('/reports/tax', { params });
      return res.data;
    },
    enabled: activeTab === 'tax',
  });

  // ─── Profit & Loss report ───
  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ['report-pl', params],
    queryFn: async () => {
      const res = await api.get('/reports/profit-loss', { params });
      return res.data;
    },
    enabled: activeTab === 'pl',
  });

  const { data: surveyData, isLoading: surveyLoading } = useQuery({
    queryKey: ['report-surveys'],
    queryFn: async () => {
      const res = await api.get('/surveys/results');
      return res.data;
    },
    enabled: activeTab === 'surveys',
  });

  const currency = settings?.currency || 'EGP';
  const centerName = settings?.centerName || 'Physio Center';

  // ─── Export functions ───
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    const canvas = await html2canvas(reportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('portrait', 'mm', 'a4');

    pdf.addImage(
      canvas.toDataURL('image/png', 0.95),
      'PNG',
      0,
      0,
      imgWidth,
      Math.min(imgHeight, 297),
    );

    pdf.save(`${activeTab}-report-${endDate}.pdf`);
  };

  const handleExportCSV = () => {
    let data: any[] = [];
    const filename = `${activeTab}-report.csv`;

    switch (activeTab) {
      case 'financial':
        data = financialData?.recentInvoices || [];
        break;

      case 'outstanding':
        data = (outstandingData || []).map((p: any) => ({
          patientName: p.patientName,
          phone: p.phone,
          totalOwed: p.totalOwed,
          invoiceCount: p.invoiceCount,
          daysOverdue: p.daysOverdue,
        }));
        break;

      case 'therapists':
        data = therapistData?.therapists || [];
        break;

      case 'patients':
        data = patientData?.topDiagnoses || [];
        break;

      case 'pl':
        data = plData?.expenses?.list || [];
        break;

      default:
        data = [];
    }

    if (data.length === 0) return;

    const headers = Object.keys(data[0]);

    const csv = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];

            return typeof val === 'string' && val.includes(',')
              ? `"${val}"`
              : val;
          })
          .join(','),
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  // ─── Quick date range buttons ───
  const setQuickRange = (
    type: 'today' | 'week' | 'month' | 'quarter' | 'year',
  ) => {
    const end = new Date();
    const start = new Date();

    switch (type) {
      case 'today':
        break;

      case 'week':
        start.setDate(start.getDate() - 7);
        break;

      case 'month':
        start.setDate(1);
        break;

      case 'quarter':
        start.setMonth(
          Math.floor(start.getMonth() / 3) * 3,
          1,
        );
        break;

      case 'year':
        start.setMonth(0, 1);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const isLoading =
    finLoading ||
    outLoading ||
    thLoading ||
    patLoading ||
    apptLoading ||
    roomLoading ||
    taxLoading ||
    plLoading ||
    surveyLoading;

  const tabs: Array<{
    key: ReportTab;
    label: string;
    labelAr: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'financial',
      label: 'Financial',
      labelAr: 'المالية',
      icon: <DollarSign size={16} />,
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      labelAr: 'المستحقات',
      icon: <AlertTriangle size={16} />,
    },
    {
      key: 'therapists',
      label: 'Therapists',
      labelAr: 'الأخصائيون',
      icon: <Users size={16} />,
    },
    {
      key: 'patients',
      label: 'Patients',
      labelAr: 'المرضى',
      icon: <Activity size={16} />,
    },
    {
      key: 'appointments',
      label: 'Appointments',
      labelAr: 'المواعيد',
      icon: <Calendar size={16} />,
    },
    {
      key: 'rooms',
      label: 'Rooms',
      labelAr: 'الغرف',
      icon: <MapPin size={16} />,
    },
    {
      key: 'tax',
      label: 'Tax',
      labelAr: 'الضرائب',
      icon: <FileText size={16} />,
    },
    {
      key: 'pl',
      label: 'P&L',
      labelAr: 'الأرباح والخسائر',
      icon: <TrendingUp size={16} />,
    },
    {
      key: 'surveys',
      label: 'Surveys',
      labelAr: 'التقييمات',
      icon: <Star size={16} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Print Header (only visible when printing) ─── */}
      <div className="hidden print:block print:mb-6">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2563eb',
            }}
          >
            {centerName}
          </div>
        </div>

        <p
          style={{
            fontSize: '12px',
            color: '#666',
            marginTop: '4px',
          }}
        >
          {L('تقرير', 'Report')}: {activeTab} | {startDate} — {endDate}
        </p>

        <hr
          style={{
            border: '1px solid #e5e7eb',
            marginTop: '12px',
          }}
        />
      </div>

      {/* ─── Header + Controls (hidden when printing) ─── */}
      <div className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {L('مركز التقارير', 'Reports Center')}
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {L(
                'جميع التقارير التي يحتاجها المركز',
                'All reports your center needs',
              )}
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-secondary !py-2 !px-4 text-sm"
            >
              <Printer size={16} />
              {L('طباعة', 'Print')}
            </button>

            <button
              onClick={handleExportPDF}
              className="btn-secondary !py-2 !px-4 text-sm"
            >
              <Download size={16} />
              PDF
            </button>

            <button
              onClick={handleExportCSV}
              className="btn-secondary !py-2 !px-4 text-sm"
            >
              <FileSpreadsheet size={16} />
              CSV
            </button>
          </div>
        </div>

        {/* Date range */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {L('من', 'From')}:
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input !w-auto !py-1.5 text-sm"
            />
          </div>

          <span className="text-gray-400">→</span>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {L('إلى', 'To')}:
            </span>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input !w-auto !py-1.5 text-sm"
            />
          </div>

          {/* Quick ranges */}
          <div className="flex gap-2">
            {(['week', 'month', 'quarter', 'year'] as const).map(
              (range) => (
                <button
                  key={range}
                  onClick={() => setQuickRange(range)}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  {range === 'week'
                    ? L('أسبوع', 'Week')
                    : range === 'month'
                      ? L('شهر', 'Month')
                      : range === 'quarter'
                        ? L('ربع', 'Quarter')
                        : L('سنة', 'Year')}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Report tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }
              `}
            >
              {tab.icon}
              <span>{lang === 'ar' ? tab.labelAr : tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Report Content ─── */}
      <div ref={reportRef} className="report-content">
        {isLoading ? (
          <Spinner className="py-24" />
        ) : (
          <>
            {/* ═══ FINANCIAL REPORT ═══ */}
            {activeTab === 'financial' && financialData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title={L('إجمالي الفواتير', 'Total Invoiced')}
                    value={`${financialData.totals.invoiced.toFixed(0)} ${currency}`}
                    icon={<DollarSign size={24} />}
                    color="primary"
                  />

                  <StatCard
                    title={L('المحصل', 'Collected')}
                    value={`${financialData.totals.collected.toFixed(0)} ${currency}`}
                    icon={<TrendingUp size={24} />}
                    color="green"
                  />

                  <StatCard
                    title={L('المستحق', 'Outstanding')}
                    value={`${financialData.totals.outstanding.toFixed(0)} ${currency}`}
                    icon={<AlertTriangle size={24} />}
                    color="red"
                  />

                  <StatCard
                    title={L('عدد الفواتير', 'Invoice Count')}
                    value={financialData.totals.invoiceCount}
                    icon={<FileText size={24} />}
                    color="yellow"
                  />
                </div>

                {/* Revenue by month chart */}
                {financialData.revenueByMonth.length > 0 && (
                  <Card>
                    <CardHeader
                      title={L(
                        'الإيرادات الشهرية',
                        'Revenue by Month',
                      )}
                    />

                    <div className="h-72">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={financialData.revenueByMonth}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value) => [
                              `${value} ${currency}`,
                              'Revenue',
                            ]}
                          />
                          <Bar
                            dataKey="total"
                            fill="#2563eb"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                {/* Payment methods pie */}
                {Object.keys(financialData.byMethod).length > 0 && (
                  <Card>
                    <CardHeader
                      title={L('طرق الدفع', 'Payment Methods')}
                    />

                    <div className="h-64">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={Object.entries(
                              financialData.byMethod,
                            ).map(([method, amount]) => ({
                              name: method.replace('_', ' '),
                              value: Math.round(Number(amount)),
                            }))}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {Object.keys(
                              financialData.byMethod,
                            ).map((_, i) => (
                              <Cell
                                key={i}
                                fill={
                                  COLORS[i % COLORS.length]
                                }
                              />
                            ))}
                          </Pie>

                          <Tooltip
                            formatter={(value) => [
                              `${value} ${currency}`,
                              '',
                            ]}
                          />

                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                {/* Recent invoices table */}
                <Card>
                  <CardHeader
                    title={L(
                      'أحدث الفواتير',
                      'Recent Invoices',
                    )}
                  />

                  <div className="divide-y divide-gray-100">
                    {(financialData.recentInvoices || []).map(
                      (inv: any) => (
                        <div
                          key={inv.number}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {inv.number}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {inv.patientName}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold">
                              {inv.total.toFixed(0)} {currency}
                            </span>

                            <Badge status={inv.status}>
                              {inv.status}
                            </Badge>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* ═══ OUTSTANDING BALANCES ═══ */}
            {activeTab === 'outstanding' && (
              <Card>
                <CardHeader
                  title={L(
                    'المستحقات المالية',
                    'Outstanding Balances',
                  )}
                  subtitle={L(
                    'المرضى الذين لديهم مبالغ مستحقة',
                    'Patients with outstanding balances',
                  )}
                />

                {(outstandingData || []).length === 0 ? (
                  <EmptyState
                    message={L(
                      'لا توجد مستحقات',
                      'No outstanding balances',
                    )}
                  />
                ) : (
                  <div className="divide-y divide-gray-100">
                    {(outstandingData || []).map(
                      (patient: any) => (
                        <div
                          key={patient.patientId}
                          className="py-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                <AlertTriangle size={20} />
                              </div>

                              <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                  {patient.patientName}
                                </p>

                                <p
                                  className="text-sm text-gray-500 dark:text-gray-400"
                                  dir="ltr"
                                >
                                  {patient.phone}
                                </p>

                                <p className="text-xs text-gray-400">
                                  {patient.invoiceCount}{' '}
                                  {L('فاتورة', 'invoices')} •{' '}
                                  {patient.daysOverdue}{' '}
                                  {L(
                                    'يوم تأخير',
                                    'days overdue',
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-end">
                                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                  {patient.totalOwed.toFixed(
                                    0,
                                  )}{' '}
                                  {currency}
                                </p>

                                <p className="text-xs text-red-400">
                                  {L('مستحق', 'owed')}
                                </p>
                              </div>

                              {/* WhatsApp button */}
                              <a
                                href={`https://wa.me/${patient.phone.replace(
                                  /[^0-9]/g,
                                  '',
                                )}?text=${encodeURIComponent(
                                  L(
                                    `مرحباً ${patient.patientName}، لديك مبلغ مستحق ${patient.totalOwed.toFixed(0)} ${currency}. يرجى التواصل لإتمام الدفع.`,
                                    `Hello ${patient.patientName}, you have an outstanding balance of ${patient.totalOwed.toFixed(0)} ${currency}. Please contact us to settle.`,
                                  ),
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600"
                                title={L(
                                  'إرسال تذكير',
                                  'Send reminder',
                                )}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="h-5 w-5"
                                >
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </Card>
            )}

            {/* ═══ THERAPIST PERFORMANCE ═══ */}
            {activeTab === 'therapists' && therapistData && (
              <div className="space-y-6">
                {/* Summary stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <StatCard
                    title={L(
                      'إجمالي الجلسات',
                      'Total Sessions',
                    )}
                    value={therapistData.therapists.reduce(
                      (s: number, t: any) => s + t.completed,
                      0,
                    )}
                    icon={<Activity size={24} />}
                    color="primary"
                  />

                  <StatCard
                    title={L(
                      'إجمالي الإيرادات',
                      'Total Revenue',
                    )}
                    value={`${therapistData.therapists
                      .reduce(
                        (s: number, t: any) => s + t.revenue,
                        0,
                      )
                      .toFixed(0)} ${currency}`}
                    icon={<DollarSign size={24} />}
                    color="green"
                  />

                  <StatCard
                    title={L(
                      'متوسط التقييم',
                      'Avg Rating',
                    )}
                    value={(
                      therapistData.therapists.reduce(
                        (s: number, t: any) =>
                          s + (t.avgRating || 0),
                        0,
                      ) /
                      (therapistData.therapists.filter(
                        (t: any) => t.avgRating,
                      ).length || 1)
                    ).toFixed(1)}
                    icon={<Star size={24} />}
                    color="yellow"
                  />
                </div>

                {/* Performance table */}
                <Card>
                  <CardHeader
                    title={L(
                      'أداء الأخصائيين',
                      'Therapist Performance',
                    )}
                  />

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-start text-xs text-gray-500 dark:text-gray-400 dark:border-gray-700">
                          <th className="pb-3 text-start">
                            {L('الاسم', 'Name')}
                          </th>

                          <th className="pb-3 text-center">
                            {L('الجلسات', 'Sessions')}
                          </th>

                          <th className="pb-3 text-center">
                            {L('الإيرادات', 'Revenue')}
                          </th>

                          <th className="pb-3 text-center">
                            {L(
                              'نسبة الإكمال',
                              'Completion',
                            )}
                          </th>

                          <th className="pb-3 text-center">
                            {L('التقييم', 'Rating')}
                          </th>

                          <th className="pb-3 text-center">
                            {L('لم يحضر', 'No-Show')}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {therapistData.therapists.map(
                          (t: any) => (
                            <tr
                              key={t.therapistId}
                              className="border-b border-gray-100 dark:border-gray-700 dark:border-gray-800"
                            >
                              <td className="py-3 font-medium text-gray-900 dark:text-gray-100">
                                {t.therapistName}
                              </td>

                              <td className="py-3 text-center">
                                {t.completed}
                              </td>

                              <td className="py-3 text-center font-semibold text-green-600">
                                {t.revenue.toFixed(0)} {currency}
                              </td>

                              <td className="py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                      className={`h-full rounded-full ${
                                        t.completionRate >=
                                        70
                                          ? 'bg-green-500'
                                          : t.completionRate >=
                                              40
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                      }`}
                                      style={{
                                        width: `${t.completionRate}%`,
                                      }}
                                    />
                                  </div>

                                  <span className="text-xs">
                                    {t.completionRate}%
                                  </span>
                                </div>
                              </td>

                              <td className="py-3 text-center">
                                {t.avgRating ? (
                                  <span className="flex items-center justify-center gap-1">
                                    <Star
                                      size={14}
                                      className="fill-amber-400 text-amber-400"
                                    />
                                    {t.avgRating}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">
                                    —
                                  </span>
                                )}
                              </td>

                              <td className="py-3 text-center text-red-500">
                                {t.noShow}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {/* Revenue comparison chart */}
                <Card>
                  <CardHeader
                    title={L(
                      'مقارنة الإيرادات',
                      'Revenue Comparison',
                    )}
                  />

                  <div className="h-64">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={therapistData.therapists.map(
                          (t: any) => ({
                            name: t.therapistName,
                            revenue: t.revenue,
                            sessions: t.completed,
                          }),
                        )}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                        />

                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                        />

                        <YAxis tick={{ fontSize: 11 }} />

                        <Tooltip />

                        <Legend />

                        <Bar
                          dataKey="revenue"
                          name={L(
                            'الإيرادات',
                            'Revenue',
                          )}
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                        />

                        <Bar
                          dataKey="sessions"
                          name={L(
                            'الجلسات',
                            'Sessions',
                          )}
                          fill="#16a34a"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            )}

            {/* ═══ PATIENT STATISTICS ═══ */}
            {activeTab === 'patients' && patientData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard
                    title={L(
                      'إجمالي المرضى',
                      'Total Patients',
                    )}
                    value={patientData.totals.totalPatients}
                    icon={<Users size={24} />}
                    color="primary"
                  />

                  <StatCard
                    title={L('مرضى جدد', 'New Patients')}
                    value={patientData.totals.newPatients}
                    icon={<TrendingUp size={24} />}
                    color="green"
                  />
                </div>

                {/* Age distribution */}
                <Card>
                  <CardHeader
                    title={L(
                      'التوزيع العمري',
                      'Age Distribution',
                    )}
                  />

                  <div className="h-64">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart data={patientData.ageDistribution}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                        />

                        <XAxis
                          dataKey="group"
                          tick={{ fontSize: 11 }}
                        />

                        <YAxis tick={{ fontSize: 11 }} />

                        <Tooltip />

                        <Bar
                          dataKey="count"
                          name={L(
                            'عدد المرضى',
                            'Patients',
                          )}
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Top diagnoses */}
                <Card>
                  <CardHeader
                    title={L(
                      'أكثر التشخيصات شيوعاً',
                      'Top Diagnoses',
                    )}
                  />

                  <div className="h-64">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={patientData.topDiagnoses}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e5e7eb"
                        />

                        <XAxis
                          type="number"
                          tick={{ fontSize: 11 }}
                        />

                        <YAxis
                          dataKey="diagnosis"
                          type="category"
                          tick={{ fontSize: 10 }}
                          width={150}
                        />

                        <Tooltip />

                        <Bar
                          dataKey="count"
                          fill="#7c3aed"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* New patients trend */}
                {patientData.newPatientsByMonth.length > 0 && (
                  <Card>
                    <CardHeader
                      title={L(
                        'المرضى الجدد شهرياً',
                        'New Patients by Month',
                      )}
                    />

                    <div className="h-64">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <LineChart
                          data={
                            patientData.newPatientsByMonth
                          }
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />

                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11 }}
                          />

                          <YAxis tick={{ fontSize: 11 }} />

                          <Tooltip />

                          <Line
                            type="monotone"
                            dataKey="count"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* ═══ APPOINTMENT ANALYTICS ═══ */}
            {activeTab === 'appointments' &&
              appointmentData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title={L(
                        'إجمالي المواعيد',
                        'Total',
                      )}
                      value={appointmentData.totals.total}
                      icon={<Calendar size={24} />}
                      color="primary"
                    />

                    <StatCard
                      title={L(
                        'مكتملة',
                        'Completed',
                      )}
                      value={`${appointmentData.totals.completed} (${appointmentData.rates.completionRate}%)`}
                      icon={<Check size={24} />}
                      color="green"
                    />

                    <StatCard
                      title={L(
                        'ملغاة',
                        'Cancelled',
                      )}
                      value={`${appointmentData.totals.cancelled} (${appointmentData.rates.cancellationRate}%)`}
                      icon={<XCircle size={24} />}
                      color="red"
                    />

                    <StatCard
                      title={L(
                        'لم يحضر',
                        'No-Show',
                      )}
                      value={`${appointmentData.totals.noShow} (${appointmentData.rates.noShowRate}%)`}
                      icon={<AlertTriangle size={24} />}
                      color="yellow"
                    />
                  </div>

                  {/* By day of week */}
                  <Card>
                    <CardHeader
                      title={L(
                        'المواعيد حسب اليوم',
                        'Appointments by Day',
                      )}
                    />

                    <div className="h-64">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={appointmentData.byDay}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />

                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11 }}
                          />

                          <YAxis tick={{ fontSize: 11 }} />

                          <Tooltip />

                          <Bar
                            dataKey="count"
                            name={L(
                              'مواعيد',
                              'Appointments',
                            )}
                            fill="#2563eb"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Peak hours */}
                  <Card>
                    <CardHeader
                      title={L(
                        'ساعات الذروة',
                        'Peak Hours',
                      )}
                      subtitle={appointmentData.peakHours
                        .map((h: any) => h.hour)
                        .join(', ')}
                    />

                    <div className="h-64">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <BarChart
                          data={appointmentData.byHour}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />

                          <XAxis
                            dataKey="hour"
                            tick={{ fontSize: 10 }}
                          />

                          <YAxis tick={{ fontSize: 11 }} />

                          <Tooltip />

                          <Bar
                            dataKey="count"
                            fill="#d97706"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              )}

            {/* ═══ ROOM UTILIZATION ═══ */}
            {activeTab === 'rooms' && roomData && (
              <Card>
                <CardHeader
                  title={L(
                    'استغلال الغرف',
                    'Room Utilization',
                  )}
                />

                <div className="h-72">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart data={roomData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e5e7eb"
                      />

                      <XAxis
                        dataKey="roomName"
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis tick={{ fontSize: 11 }} />

                      <Tooltip />

                      <Legend />

                      <Bar
                        dataKey="appointmentCount"
                        name={L(
                          'عدد المواعيد',
                          'Appointments',
                        )}
                        fill="#2563eb"
                        radius={[4, 4, 0, 0]}
                      />

                      <Bar
                        dataKey="utilizationRate"
                        name={L(
                          'نسبة الاستغلال %',
                          'Utilization %',
                        )}
                        fill="#16a34a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 divide-y divide-gray-100">
                  {roomData.map((room: any) => (
                    <div
                      key={room.roomNumber}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                          <MapPin size={16} />
                        </div>

                        <div>
                          <p className="text-sm font-medium">
                            {room.roomName}
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {room.appointmentCount}{' '}
                            {L('موعد', 'appointments')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {room.bookedHours}h
                        </span>

                        <div className="w-24">
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className={`h-full rounded-full ${
                                room.utilizationRate >= 70
                                  ? 'bg-green-500'
                                  : room.utilizationRate >= 40
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  room.utilizationRate,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <span className="text-sm font-semibold">
                          {room.utilizationRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* ═══ TAX REPORT ═══ */}
            {activeTab === 'tax' && taxData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title={L(
                      'الإيرادات الإجمالية',
                      'Gross Revenue',
                    )}
                    value={`${taxData.totals.grossRevenue.toFixed(0)} ${currency}`}
                    icon={<DollarSign size={24} />}
                    color="primary"
                  />

                  <StatCard
                    title={L(
                      'الضريبة المحصلة',
                      'Tax Collected',
                    )}
                    value={`${taxData.totals.taxCollected.toFixed(0)} ${currency}`}
                    icon={<FileText size={24} />}
                    color="yellow"
                  />

                  <StatCard
                    title={L(
                      'الإيرادات الصافية',
                      'Net Revenue',
                    )}
                    value={`${taxData.totals.netRevenue.toFixed(0)} ${currency}`}
                    icon={<TrendingUp size={24} />}
                    color="green"
                  />

                  <StatCard
                    title={L(
                      'نسبة الضريبة',
                      'Tax Rate',
                    )}
                    value={`${taxData.taxRate}%`}
                    icon={<Activity size={24} />}
                    color="red"
                  />
                </div>

                <Card>
                  <CardHeader
                    title={L(
                      'تقرير الضريبة',
                      'Tax Report',
                    )}
                    subtitle={L(
                      'لأغراض التقديم الضريبي',
                      'For tax filing purposes',
                    )}
                  />

                  <div className="space-y-4">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-900 p-4 dark:bg-gray-800">
                      <div className="flex justify-between py-2">
                        <span>
                          {L(
                            'إجمالي الفواتير',
                            'Total Invoices (Gross)',
                          )}
                        </span>

                        <span className="font-semibold">
                          {taxData.totals.grossRevenue.toFixed(
                            2,
                          )}{' '}
                          {currency}
                        </span>
                      </div>

                      <div className="flex justify-between py-2">
                        <span>
                          {L(
                            'الضريبة المستحقة',
                            'Tax Due',
                          )}{' '}
                          ({taxData.taxRate}%)
                        </span>

                        <span className="font-semibold text-yellow-600">
                          {taxData.totals.taxCollected.toFixed(
                            2,
                          )}{' '}
                          {currency}
                        </span>
                      </div>

                      <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 py-2 pt-4 dark:border-gray-700">
                        <span className="font-semibold">
                          {L(
                            'الإيرادات الصافية (قبل الضريبة)',
                            'Net Revenue (before tax)',
                          )}
                        </span>

                        <span className="font-bold text-green-600">
                          {taxData.totals.netRevenue.toFixed(
                            2,
                          )}{' '}
                          {currency}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      {L(
                        'هذا التقرير للتقديم فقط — يرجى استشارة محاسب قانوني',
                        'This report is for estimation only — please consult a certified accountant',
                      )}
                    </p>
                  </div>
                </Card>
              </div>
            )}

            {/* ═══ PROFIT & LOSS REPORT ═══ */}
            {activeTab === 'pl' && plData && (
              <div className="space-y-6">
                {/* Profit/Loss header */}
                <Card>
                  <div
                    className={`rounded-xl p-6 text-center ${
                      plData.profit.status === 'PROFIT'
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : plData.profit.status === 'LOSS'
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <p
                      className={`text-4xl font-bold ${
                        plData.profit.status === 'PROFIT'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {plData.profit.net.toFixed(0)} {currency}
                    </p>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {plData.profit.status === 'PROFIT'
                        ? L('ربح صافي', 'Net Profit')
                        : L('خسارة صافية', 'Net Loss')}
                      {' · '}
                      {plData.profit.margin}%{' '}
                      {L('هامش', 'margin')}
                    </p>
                  </div>
                </Card>

                {/* Revenue vs Expenses */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard
                    title={L(
                      'الإيرادات المحصلة',
                      'Revenue Collected',
                    )}
                    value={`${plData.revenue.collected.toFixed(0)} ${currency}`}
                    icon={<DollarSign size={24} />}
                    color="green"
                  />

                  <StatCard
                    title={L('المصروفات', 'Expenses')}
                    value={`${plData.expenses.total.toFixed(0)} ${currency}`}
                    icon={<TrendingDown size={24} />}
                    color="red"
                  />
                </div>

                {/* Expenses by category */}
                <Card>
                  <CardHeader
                    title={L(
                      'المصروفات حسب الفئة',
                      'Expenses by Category',
                    )}
                  />

                  <div className="h-64">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <PieChart>
                        <Pie
                          data={Object.entries(
                            plData.expenses.byCategory,
                          ).map(([cat, amount]) => ({
                            name: cat,
                            value: Math.round(
                              amount as number,
                            ),
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {Object.keys(
                            plData.expenses.byCategory,
                          ).map((_, i) => (
                            <Cell
                              key={i}
                              fill={
                                COLORS[i % COLORS.length]
                              }
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          formatter={(value) => [
                            `${value} ${currency}`,
                            '',
                          ]}
                        />

                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Expense list */}
                <Card>
                  <CardHeader
                    title={L(
                      'قائمة المصروفات',
                      'Expense List',
                    )}
                  />

                  <div className="divide-y divide-gray-100">
                    {(plData.expenses.list || []).map(
                      (exp: any) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {exp.description}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {exp.category} ·{' '}
                              {new Date(
                                exp.date,
                              ).toLocaleDateString()}
                            </p>
                          </div>

                          <span className="font-semibold text-red-600">
                            {exp.amount.toFixed(0)} {currency}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* ═══ SURVEYS REPORT ═══ */}
            {activeTab === 'surveys' && surveyData && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard
                    title={L('متوسط التقييم', 'Average Rating')}
                    value={surveyData.summary.averageRating || '—'}
                    icon={<Star size={24} />}
                    color="yellow"
                  />
                  <StatCard
                    title={L('عدد التقييمات', 'Total Responses')}
                    value={surveyData.summary.totalResponses}
                    icon={<MessageSquare size={24} />}
                    color="primary"
                  />
                </div>

                {/* Rating distribution */}
                <Card>
                  <CardHeader title={L('توزيع التقييمات', 'Rating Distribution')} />
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={surveyData.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="stars" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="count" name={L('عدد', 'Count')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* By therapist */}
                <Card>
                  <CardHeader title={L('تقييم الأخصائيين', 'Therapist Ratings')} />
                  <div className="divide-y divide-gray-100">
                    {surveyData.byTherapist.map((t: any) => (
                      <div key={t.therapistId} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <StarRating value={Math.round(t.averageRating || 0)} size={16} />
                          <span className="text-sm font-medium">{t.therapistName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-amber-600">{t.averageRating}</span>
                          <span className="text-xs text-gray-400">({t.responseCount})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent feedback */}
                <Card>
                  <CardHeader title={L('أحدث التعليقات', 'Recent Feedback')} />
                  <div className="divide-y divide-gray-100">
                    {surveyData.recentSurveys.map((s: any) => (
                      <div key={s.id} className="py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <StarRating value={s.rating} size={14} />
                            <span className="text-sm font-medium">{s.therapistName}</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(s.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {s.feedback && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">"{s.feedback}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
