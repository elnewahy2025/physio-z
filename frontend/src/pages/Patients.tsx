import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Phone, Mail, AlertCircle, X, Users, Activity, FileText } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { ar } from '../ar';
import { Card, CardHeader, EmptyState, Spinner } from '../components/ui';
import type { Patient } from '../types';
import PatientProfileDashboard from '../components/PatientProfileDashboard';

export default function Patients() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'NEWEST'>('NEWEST');

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: async () => {
      const res = await api.get('/patients', {
        params: { search: search || undefined, page, limit: 20 },
      });
      return res.data;
    },
  });

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const patients: Patient[] = data?.data || [];
  const pagination = data?.pagination;
  const canAdd = user?.role === 'OWNER' || user?.role === 'SECRETARY';

  // Apply sorting if NEWEST is active (assuming the backend might not sort explicitly)
  const displayPatients = useMemo(() => {
    let list = [...patients];
    if (activeTab === 'NEWEST') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [patients, activeTab]);

  return (
    <div className="space-y-8 pb-12">
      {/* Header and Stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('patients')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {L('إدارة ملفات المرضى والسجلات الطبية', 'Manage patient profiles and medical records')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={t('search')} className="input !w-64 !ps-9"
              />
            </div>
            {canAdd && (
              <button onClick={() => setShowForm(true)} className="btn-primary whitespace-nowrap">
                <Plus size={16} />
                <span className="hidden sm:inline">{L(ar.addPatient, 'Add Patient')}</span>
                <span className="sm:hidden">{L('إضافة', 'Add')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title={L('إجمالي المرضى', 'Total Patients')} 
            count={pagination?.total || 0} 
            color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            icon={<Users className="w-6 h-6 opacity-50" />}
          />
          <StatCard 
            title={L('المرضى في هذه الصفحة', 'Patients on this page')} 
            count={patients.length} 
            color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            icon={<Activity className="w-6 h-6 opacity-50" />}
          />
          <StatCard 
            title={L('الصفحات', 'Pages')} 
            count={pagination?.totalPages || 0} 
            color="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
            icon={<FileText className="w-6 h-6 opacity-50" />}
          />
        </div>
      </div>

      <Card>
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-2 flex gap-6 overflow-x-auto">
          <TabButton active={activeTab === 'NEWEST'} onClick={() => setActiveTab('NEWEST')} label={L('الأحدث', 'Newest')} />
          <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} label={L('الكل', 'All')} />
        </div>

        <div className="p-6">
          {isLoading ? (
            <Spinner className="py-24" />
          ) : displayPatients.length === 0 ? (
            <EmptyState message={t('noData')} />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {displayPatients.map((patient) => (
                <div 
                  key={patient.id} 
                  onClick={() => setSelectedPatientId(patient.id)}
                  className="border border-gray-100 dark:border-gray-700/60 rounded-2xl p-5 hover:shadow-md transition-shadow bg-white dark:bg-gray-800 cursor-pointer flex flex-col sm:flex-row gap-5"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-2xl font-bold text-primary-700 dark:text-primary-400">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{patient.name}</p>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Phone size={14} className="text-gray-400" />{patient.phone}</span>
                        {patient.email && (
                          <span className="flex items-center gap-1"><Mail size={14} className="text-gray-400" />{patient.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700 pt-4 sm:pt-0 sm:pl-4 mt-4 sm:mt-0 justify-around sm:justify-start">
                    <div className="text-center sm:text-end">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{patient._count?.appointments || 0}</p>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('appointments')}</p>
                    </div>
                    <div className="w-px h-10 bg-gray-100 dark:bg-gray-700 hidden sm:block"></div>
                    <div className="text-center sm:text-end">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{patient._count?.invoices || 0}</p>
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('invoices')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-6">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary !py-2 !px-4 text-sm font-medium">
                {L(ar.previous, 'Previous')}
              </button>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {page} / {pagination.totalPages}
              </span>
              <button onClick={() => setPage(page + 1)} disabled={page >= pagination.totalPages} className="btn-secondary !py-2 !px-4 text-sm font-medium">
                {L(ar.next, 'Next')}
              </button>
            </div>
          )}
        </div>
      </Card>

      {selectedPatientId && (
        <PatientProfileDashboard
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}

      {/* Modal for New Patient */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {L(ar.addPatient, 'Add Patient')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <NewPatientForm onClose={() => setShowForm(false)} />
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

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 px-2 whitespace-nowrap text-sm font-medium transition-colors border-b-2 flex items-center gap-2
        ${active 
          ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
        }`}
    >
      {label}
    </button>
  );
}

function NewPatientForm({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', dateOfBirth: '', medicalHistory: '',
  });

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const createPatient = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = { name: data.name, phone: data.phone };
      if (data.email) payload.email = data.email;
      if (data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth;
      if (data.medicalHistory) payload.medicalHistory = data.medicalHistory;
      await api.post('/patients', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create patient');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createPatient.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className="label mb-1 block">{L(ar.nameLabel, 'Name')} *</label>
          <input type="text" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input w-full" required minLength={2} />
        </div>
        <div>
          <label className="label mb-1 block">{t('phone')} *</label>
          <input type="tel" value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input w-full" required minLength={8} placeholder="01xxxxxxxxx" dir="ltr" />
        </div>
        <div>
          <label className="label mb-1 block">{t('email')}</label>
          <input type="email" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input w-full" />
        </div>
        <div>
          <label className="label mb-1 block">{L(ar.dateOfBirth, 'Date of Birth')}</label>
          <input type="date" value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="input w-full" />
        </div>
        <div className="sm:col-span-2">
          <label className="label mb-1 block">{L(ar.medicalHistory, 'Medical History')}</label>
          <textarea value={formData.medicalHistory}
            onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
            className="input w-full" rows={3}
            placeholder={L(ar.medicalHistoryPlaceholder, 'Any conditions, medications, allergies...')} />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button type="button" onClick={onClose} className="btn-secondary px-6">{t('cancel')}</button>
        <button type="submit" disabled={createPatient.isPending} className="btn-primary px-8">
          {createPatient.isPending ? t('loading') : t('save')}
        </button>
      </div>
    </form>
  );
}