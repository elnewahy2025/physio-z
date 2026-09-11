import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Phone, Mail, AlertCircle } from 'lucide-react';
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

  if (isLoading) return <Spinner className="py-24" />;

  const patients: Patient[] = data?.data || [];
  const pagination = data?.pagination;
  const canAdd = user?.role === 'OWNER' || user?.role === 'SECRETARY';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('patients')}
          subtitle={`${pagination?.total || 0} ${L(ar.patientCount, 'patients')}`}
          action={
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
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                  <Plus size={16} />
                  {L(ar.addPatient, 'Add Patient')}
                </button>
              )}
            </div>
          }
        />

        {showForm && <NewPatientForm onClose={() => setShowForm(false)} />}

        {patients.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {patients.map((patient) => (
                <div 
                  key={patient.id} 
                  onClick={() => setSelectedPatientId(patient.id)}
                  className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{patient.name}</p>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Phone size={14} />{patient.phone}</span>
                        {patient.email && (
                          <span className="flex items-center gap-1"><Mail size={14} />{patient.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient._count?.appointments || 0}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('appointments')}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{patient._count?.invoices || 0}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('invoices')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary !py-1.5 !px-3 text-sm">
                  {L(ar.previous, 'Previous')}
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {pagination.totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page >= pagination.totalPages} className="btn-secondary !py-1.5 !px-3 text-sm">
                  {L(ar.next, 'Next')}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {selectedPatientId && (
        <PatientProfileDashboard
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
    </div>
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
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-primary-200 bg-primary-50/50 p-6">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{L(ar.nameLabel, 'Name')} *</label>
          <input type="text" value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input" required minLength={2} />
        </div>
        <div>
          <label className="label">{t('phone')} *</label>
          <input type="tel" value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="input" required minLength={8} placeholder="01xxxxxxxxx" dir="ltr" />
        </div>
        <div>
          <label className="label">{t('email')}</label>
          <input type="email" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input" />
        </div>
        <div>
          <label className="label">{L(ar.dateOfBirth, 'Date of Birth')}</label>
          <input type="date" value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">{L(ar.medicalHistory, 'Medical History')}</label>
          <textarea value={formData.medicalHistory}
            onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
            className="input" rows={3}
            placeholder={L(ar.medicalHistoryPlaceholder, 'Any conditions, medications, allergies...')} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
        <button type="submit" disabled={createPatient.isPending} className="btn-primary">
          {createPatient.isPending ? t('loading') : t('save')}
        </button>
      </div>
    </form>
  );
}