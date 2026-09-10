// frontend/src/components/ProgressChart.tsx
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, EmptyState } from './ui';

interface ProgressData {
  patientId: string;
  totalSessions: number;
  progress: Array<{
    sessionNumber: number;
    date: string;
    painLevel: number | null;
    diagnosis: string;
    duration: number;
  }>;
  summary: {
    initialPainLevel: number | null;
    currentPainLevel: number | null;
    improvementPercent: number | null;
    trend: string;
  };
}

export default function ProgressChart({ patientId }: { patientId: string }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data, isLoading } = useQuery({
    queryKey: ['patient-progress', patientId],
    queryFn: async () => {
      const res = await api.get(`/patients/${patientId}/progress`);
      return res.data as ProgressData;
    },
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <Card>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </Card>
    );
  }

  if (!data || data.progress.length === 0) {
    return (
      <Card>
        <CardHeader title={L('تقدم العلاج', 'Treatment Progress')} />
        <EmptyState message={L('لا توجد بيانات تقدم بعد', 'No progress data yet')} />
      </Card>
    );
  }

  const chartData = data.progress
    .filter((p) => p.painLevel !== null)
    .map((p) => ({
      session: `#${p.sessionNumber}`,
      pain: p.painLevel,
      date: new Date(p.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));

  const trendIcon =
    data.summary.trend === 'IMPROVING' ? <TrendingUp size={20} className="text-green-600" />
    : data.summary.trend === 'WORSENING' ? <TrendingDown size={20} className="text-red-600" />
    : <Minus size={20} className="text-gray-500" />;

  const trendColor =
    data.summary.trend === 'IMPROVING' ? 'text-green-600 bg-green-50'
    : data.summary.trend === 'WORSENING' ? 'text-red-600 bg-red-50'
    : 'text-gray-600 bg-gray-50';

  return (
    <Card>
      <CardHeader
        title={L('تقدم العلاج', 'Treatment Progress')}
        subtitle={`${data.totalSessions} ${L('جلسة', 'sessions')}`}
        action={
          data.summary.improvementPercent !== null && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${trendColor}`}>
              {trendIcon}
              <span className="text-sm font-semibold">
                {data.summary.improvementPercent > 0 ? '+' : ''}
                {data.summary.improvementPercent}%
              </span>
            </div>
          )
        }
      />

      {chartData.length > 0 ? (
        <>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="session" tick={{ fontSize: 11 }} />
                <YAxis
                  domain={[0, 10]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{ fontSize: 11 }}
                  label={{ value: L('مستوى الألم', 'Pain Level'), angle: -90, position: 'insideLeft', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}/10`, L('مستوى الألم', 'Pain')]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `${label} — ${payload[0].payload.date}`;
                    }
                    return label;
                  }}
                />
                {/* Green zone (low pain) */}
                <ReferenceLine y={3} stroke="#16a34a" strokeDasharray="5 5" label={{ value: 'Good', fontSize: 10, fill: '#16a34a' }} />
                {/* Red zone (high pain) */}
                <ReferenceLine y={7} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Severe', fontSize: 10, fill: '#dc2626' }} />
                <Line
                  type="monotone"
                  dataKey="pain"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#2563eb' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
              <p className="text-xs text-gray-500">{L('الألم الأولي', 'Initial Pain')}</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {data.summary.initialPainLevel ?? '—'}/10
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
              <p className="text-xs text-gray-500">{L('الألم الحالي', 'Current Pain')}</p>
              <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                {data.summary.currentPainLevel ?? '—'}/10
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-center dark:bg-gray-800">
              <p className="text-xs text-gray-500">{L('التحسن', 'Improvement')}</p>
              <p className={`mt-1 text-xl font-bold ${
                (data.summary.improvementPercent || 0) > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.summary.improvementPercent !== null ? `${data.summary.improvementPercent}%` : '—'}
              </p>
            </div>
          </div>
        </>
      ) : (
        <EmptyState message={L('لم يتم تسجيل مستوى الألم بعد', 'No pain levels recorded yet')} />
      )}
    </Card>
  );
}