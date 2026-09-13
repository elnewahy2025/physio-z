import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Activity, BookOpen, Clock, X, Calendar as CalendarIcon, User, Users, FileText } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import SessionCharting from '../modules/clinical/components/SessionCharting';
import { Card, Badge, EmptyState, Spinner } from '../components/ui';

interface TherapySession {
  id: string;
  appointmentId: string;
  therapistId: string;
  diagnosis: string;
  treatmentPlan: string | null;
  notes: string | null;
  duration: number;
  painLevel: number | null;
  createdAt: string;
  appointment: {
    id: string;
    dateTime: string;
    patient: { id: string; name: string; phone: string };
  };
  therapist: { id: string; name: string };
}

export default function Sessions() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterTherapist, setFilterTherapist] = useState<string>('ALL');

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions', { params: { limit: 100 } });
      return res.data;
    },
  });

  const sessions: TherapySession[] = data?.data || [];

  // Extract unique therapists for the filter
  const therapists = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach(s => map.set(s.therapist.id, s.therapist.name));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  // Apply filters
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      let matches = true;
      if (filterTherapist !== 'ALL' && s.therapist.id !== filterTherapist) matches = false;
      if (filterDate) {
        const sessionDate = new Date(s.appointment.dateTime).toISOString().split('T')[0];
        if (sessionDate !== filterDate) matches = false;
      }
      return matches;
    });
  }, [sessions, filterDate, filterTherapist]);

  // Calculate Stats
  const stats = useMemo(() => {
    if (filteredSessions.length === 0) return { total: 0, avgDuration: 0, avgPain: 0 };
    const totalDuration = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionsWithPain = filteredSessions.filter(s => s.painLevel !== null);
    const totalPain = sessionsWithPain.reduce((sum, s) => sum + (s.painLevel || 0), 0);
    
    return {
      total: filteredSessions.length,
      avgDuration: Math.round(totalDuration / filteredSessions.length),
      avgPain: sessionsWithPain.length ? Math.round((totalPain / sessionsWithPain.length) * 10) / 10 : 0
    };
  }, [filteredSessions]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('sessions')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {L('سجل الجلسات العلاجية والملاحظات السريرية', 'Treatment sessions and clinical notes')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/protocols')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-bold transition"
            >
              <BookOpen size={15} />
              <span className="hidden sm:inline">{L('البروتوكولات السريرية', 'Clinical Protocols')}</span>
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary whitespace-nowrap">
              <Plus size={16} />
              <span className="hidden sm:inline">{L('إضافة جلسة', 'Add Session')}</span>
              <span className="sm:hidden">{L('إضافة', 'Add')}</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title={L('إجمالي الجلسات', 'Total Sessions')} 
            count={stats.total} 
            color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            icon={<FileText className="w-6 h-6 opacity-50" />}
          />
          <StatCard 
            title={L('متوسط المدة (دقيقة)', 'Avg Duration (min)')} 
            count={stats.avgDuration} 
            color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            icon={<Clock className="w-6 h-6 opacity-50" />}
          />
          <StatCard 
            title={L('متوسط مستوى الألم', 'Avg Pain Level')} 
            count={stats.avgPain} 
            color="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
            icon={<Activity className="w-6 h-6 opacity-50" />}
          />
        </div>
      </div>

      <Card>
        {/* Filters */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-wrap gap-4 items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">{L('المعالج:', 'Therapist:')}</span>
            <div className="relative">
              <User size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterTherapist}
                onChange={(e) => setFilterTherapist(e.target.value)}
                className="input !py-1.5 !ps-8 !text-sm !w-auto"
              >
                <option value="ALL">{L('الكل', 'All Therapists')}</option>
                {therapists.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">{L('التاريخ:', 'Date:')}</span>
            <div className="relative flex items-center">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input !py-1.5 !text-sm !w-auto pr-8"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute right-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <Spinner className="py-24" />
          ) : filteredSessions.length === 0 ? (
            <EmptyState message={t('noData')} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredSessions.map((session) => (
                <div key={session.id} className="border border-gray-100 dark:border-gray-700/60 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 flex flex-col gap-4">
                  
                  {/* Top: Patient & Status */}
                  <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{session.appointment.patient.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <CalendarIcon size={12} />
                          {new Date(session.appointment.dateTime).toLocaleDateString(
                            lang === 'ar' ? 'ar-EG' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                          <span className="mx-1">•</span>
                          <User size={12} />
                          {session.therapist.name}
                        </p>
                      </div>
                    </div>
                    <Badge status="COMPLETED">
                      {L('مكتملة', 'Completed')}
                    </Badge>
                  </div>

                  {/* Middle: Clinical Details */}
                  <div className="space-y-3 flex-1 text-sm">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                        {L('التشخيص', 'Diagnosis')}
                      </span>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{session.diagnosis}</p>
                    </div>
                    
                    {session.treatmentPlan && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                          {L('خطة العلاج', 'Treatment Plan')}
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700/50">
                          {session.treatmentPlan}
                        </p>
                      </div>
                    )}
                    
                    {session.notes && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                          {L('ملاحظات', 'Notes')}
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 italic">"{session.notes}"</p>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Metrics */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1.5 rounded-md">
                      <Clock size={14} />
                      {session.duration} {L('د', 'min')}
                    </div>
                    
                    {session.painLevel !== null && (
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md
                        ${session.painLevel <= 3 ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                          : session.painLevel <= 6 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                        <Activity size={14} />
                        {L('الألم:', 'Pain:')} {session.painLevel}/10
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Modal for Add Session */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {L('إضافة جلسة', 'Add Session')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <SessionCharting onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, count, color, icon }: { title: string; count: number; color: string; icon: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-5 flex items-center justify-between ${color}`}>
      <div>
        <span className="text-3xl font-bold">{count}</span>
        <p className="text-xs font-medium uppercase tracking-wider opacity-80 mt-1">{title}</p>
      </div>
      {icon}
    </div>
  );
}