 $ErrorActionPreference = 'Stop'

function Save-File {
    param([string]$Path, [string]$Content)
    $Path = Join-Path $PSScriptRoot $Path
    $dir = Split-Path $Path -Parent
    if ($dir -and !(Test-Path $dir)) {
        New-Item -Path $dir -ItemType Directory -Force | Out-Null
    }
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "  OK: $Path" -ForegroundColor Green
}

Write-Host "=== Fixing Arabic (Unicode escapes - encoding proof) ===" -ForegroundColor Magenta

# ── Arabic translations file (ALL ASCII - Unicode escapes) ──
 $arTs = @'
// Arabic translations using Unicode escape sequences.
// These are encoding-proof: the JS engine renders them as proper Arabic at runtime.
export const ar = {
  // Appointments
  newAppointment: '\u0645\u0648\u0639\u062f \u062c\u062f\u064a\u062f',
  selectPatient: '\u0627\u062e\u062a\u0631 \u0645\u0631\u064a\u0636',
  selectTherapist: '\u0627\u062e\u062a\u0631 \u0623\u062e\u0635\u0627\u0626\u064a',
  therapist: '\u0623\u062e\u0635\u0627\u0626\u064a \u0627\u0644\u0639\u0644\u0627\u062c',
  noRoom: '\u0628\u062f\u0648\u0646 \u063a\u0631\u0641\u0629',
  dateTimeLabel: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u0648\u0627\u0644\u0648\u0642\u062a',
  durationMin: '\u0627\u0644\u0645\u062f\u0629 (\u062f\u0642\u064a\u0642\u0629)',
  notesLabel: '\u0645\u0644\u0627\u062d\u0638\u0627\u062a',
  notesPlaceholder: '\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629...',
  appointmentCount: '\u0645\u0648\u0639\u062f',

  // Patients
  addPatient: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0631\u064a\u0636',
  nameLabel: '\u0627\u0644\u0627\u0633\u0645',
  dateOfBirth: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0645\u064a\u0644\u0627\u062f',
  medicalHistory: '\u0627\u0644\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0637\u0628\u064a',
  medicalHistoryPlaceholder: '\u0623\u064a \u062d\u0627\u0644\u0629 \u0637\u0628\u064a\u0629\u060c \u0623\u062f\u0648\u064a\u0629\u060c \u062d\u0633\u0627\u0633\u064a\u0629...',
  previous: '\u0627\u0644\u0633\u0627\u0628\u0642',
  next: '\u0627\u0644\u062a\u0627\u0644\u064a',
  patientCount: '\u0645\u0631\u064a\u0636',

  // Invoices
  newInvoice: '\u0641\u0627\u062a\u0648\u0631\u0629 \u062c\u062f\u064a\u062f\u0629',
  allStatuses: '\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
  amountLabel: '\u0627\u0644\u0645\u0628\u0644\u063a',
  remaining: '\u0627\u0644\u0645\u062a\u0628\u0642\u064a',
  pay: '\u062f\u0641\u0639',
  recordPayment: '\u062a\u0633\u062c\u064a\u0644 \u062f\u0641\u0639\u0629',
  paymentMethod: '\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062f\u0641\u0639',
  cash: '\u0646\u0642\u062f\u064a',
  card: '\u0628\u0637\u0627\u0642\u0629',
  bankTransfer: '\u062a\u062d\u0648\u064a\u0644 \u0628\u0646\u0643\u064a',
  confirmPayment: '\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u062f\u0641\u0639',
  invoiceCount: '\u0641\u0627\u062a\u0648\u0631\u0629',

  // Settings
  centerConfig: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0645\u0631\u0643\u0632 \u0627\u0644\u0639\u0644\u0627\u062c \u0627\u0644\u0637\u0628\u064a\u0639\u064a',
  settingsSaved: '\u062a\u0645 \u062d\u0641\u0638 \u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0646\u062c\u0627\u062d',
  centerInfo: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0645\u0631\u0643\u0632',
  centerNameLabel: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0631\u0643\u0632',
  addressLabel: '\u0627\u0644\u0639\u0646\u0648\u0627\u0646',
  googleMapsLabel: '\u0631\u0627\u0628\u0637 \u062e\u0631\u0627\u0626\u0637 \u062c\u0648\u062c\u0644',
  financialSettings: '\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0627\u0644\u064a\u0629',
  sessionPriceLabel: '\u0633\u0639\u0631 \u0627\u0644\u062c\u0644\u0633\u0629',
  currencyLabel: '\u0627\u0644\u0639\u0645\u0644\u0629',
  taxRateLabel: '\u0646\u0633\u0628\u0629 \u0627\u0644\u0636\u0631\u064a\u0628\u0629 %',
  whatsappTemplateLabel: '\u0642\u0627\u0644\u0628 \u0631\u0633\u0627\u0644\u0629 \u0648\u0627\u062a\u0633\u0627\u0628',
  saveSettingsLabel: '\u062d\u0641\u0638 \u0625\u0639\u062f\u0627\u062f\u0627\u062a',
  templateHint: '\u0627\u0633\u062a\u062e\u062f\u0645: {patient_name}\u060c {date_time}\u060c {center_name}',
};
'@
Save-File "frontend\src\ar.ts" $arTs

# ── Appointments page (ASCII only - uses ar.ts for Arabic) ──
 $appointmentsPage = @'
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { ar } from '../ar';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';
import type { Appointment } from '../types';

export default function Appointments() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [filterDate, setFilterDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [showForm, setShowForm] = useState(false);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments', filterDate],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '50' };
      if (filterDate) params.date = filterDate;
      const res = await api.get('/appointments', { params });
      return res.data.data as Appointment[];
    },
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 100 } });
      return res.data.data as any[];
    },
    enabled: showForm,
  });

  const { data: therapists } = useQuery({
    queryKey: ['therapists-list'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { role: 'THERAPIST' } });
      return res.data as any[];
    },
    enabled: showForm,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms-list'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data as any[];
    },
    enabled: showForm,
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/appointments/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const statusLabels: Record<string, string> = {
    PENDING: t('pending'),
    CONFIRMED: t('confirmed'),
    COMPLETED: t('completed'),
    CANCELLED: t('cancelled'),
    NO_SHOW: t('noShow'),
  };

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  if (isLoading) return <Spinner className="py-24" />;

  const list = appointments || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('appointments')}
          subtitle={`${list.length} ${L(ar.appointmentCount, 'appointments')}`}
          action={
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input !w-auto"
              />
              {(user?.role === 'OWNER' || user?.role === 'SECRETARY' || user?.role === 'PATIENT') && (
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                  <Plus size={16} />
                  {L(ar.newAppointment, 'New Appointment')}
                </button>
              )}
            </div>
          }
        />

        {showForm && (
          <NewAppointmentForm
            patients={patients || []}
            therapists={therapists || []}
            rooms={rooms || []}
            onClose={() => setShowForm(false)}
          />
        )}

        {list.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <div className="divide-y divide-gray-100">
            {list.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{appt.patient.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(appt.dateTime)} · {appt.therapist.name}
                      {appt.room && ` · Room ${appt.room.number}`}
                      · {appt.duration}min
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={appt.status}>
                    {statusLabels[appt.status] || appt.status}
                  </Badge>
                  {appt.status === 'PENDING' && (
                    <button
                      onClick={() => changeStatus.mutate({ id: appt.id, status: 'CONFIRMED' })}
                      className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                      title={t('confirmed')}
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {(appt.status === 'PENDING' || appt.status === 'CONFIRMED') && (
                    <button
                      onClick={() => changeStatus.mutate({ id: appt.id, status: 'CANCELLED' })}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      title={t('cancelled')}
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function NewAppointmentForm({
  patients, therapists, rooms, onClose,
}: {
  patients: any[]; therapists: any[]; rooms: any[]; onClose: () => void;
}) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientId: '', therapistId: '', roomId: '', dateTime: '', duration: '45', notes: '',
  });

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const createAppointment = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/appointments', {
        ...data, duration: parseInt(data.duration), roomId: data.roomId || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create appointment');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createAppointment.mutate(formData);
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  const defaultDateTime = tomorrow.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-primary-200 bg-primary-50/50 p-6">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label">{t('patients')}</label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="input" required
          >
            <option value="">{L(ar.selectPatient, 'Select patient')}</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{L(ar.therapist, 'Therapist')}</label>
          <select
            value={formData.therapistId}
            onChange={(e) => setFormData({ ...formData, therapistId: e.target.value })}
            className="input" required
          >
            <option value="">{L(ar.selectTherapist, 'Select therapist')}</option>
            {therapists.map((th) => (
              <option key={th.id} value={th.id}>{th.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{t('rooms')}</label>
          <select
            value={formData.roomId}
            onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
            className="input"
          >
            <option value="">{L(ar.noRoom, 'No room')}</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>Room {r.number}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{L(ar.dateTimeLabel, 'Date & Time')}</label>
          <input
            type="datetime-local"
            value={formData.dateTime || defaultDateTime}
            onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
            className="input" required
          />
        </div>
        <div>
          <label className="label">{L(ar.durationMin, 'Duration (min)')}</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="input"
          >
            <option value="30">30</option>
            <option value="45">45</option>
            <option value="60">60</option>
            <option value="90">90</option>
          </select>
        </div>
        <div>
          <label className="label">{L(ar.notesLabel, 'Notes')}</label>
          <input
            type="text" value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="input" placeholder={L(ar.notesPlaceholder, 'Additional notes...')}
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
        <button type="submit" disabled={createAppointment.isPending} className="btn-primary">
          {createAppointment.isPending ? t('loading') : t('save')}
        </button>
      </div>
    </form>
  );
}
'@
Save-File "frontend\src\pages\Appointments.tsx" $appointmentsPage

# ── Patients page ──
 $patientsPage = @'
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Phone, Mail, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { ar } from '../ar';
import { Card, CardHeader, EmptyState, Spinner } from '../components/ui';
import type { Patient } from '../types';

export default function Patients() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

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
                <div key={patient.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-semibold text-primary-700">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{patient.name}</p>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Phone size={14} />{patient.phone}</span>
                        {patient.email && (
                          <span className="flex items-center gap-1"><Mail size={14} />{patient.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="text-sm font-medium text-gray-900">{patient._count?.appointments || 0}</p>
                      <p className="text-xs text-gray-500">{t('appointments')}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-medium text-gray-900">{patient._count?.invoices || 0}</p>
                      <p className="text-xs text-gray-500">{t('invoices')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="btn-secondary !py-1.5 !px-3 text-sm">
                  {L(ar.previous, 'Previous')}
                </button>
                <span className="text-sm text-gray-500">{page} / {pagination.totalPages}</span>
                <button onClick={() => setPage(page + 1)} disabled={page >= pagination.totalPages} className="btn-secondary !py-1.5 !px-3 text-sm">
                  {L(ar.next, 'Next')}
                </button>
              </div>
            )}
          </>
        )}
      </Card>
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
'@
Save-File "frontend\src\pages\Patients.tsx" $patientsPage

# ── Invoices page ──
 $invoicesPage = @'
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, CreditCard, DollarSign, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { ar } from '../ar';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../components/ui';
import type { Invoice } from '../types';

export default function Invoices() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [paymentFor, setPaymentFor] = useState<Invoice | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '20', page: String(page) };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/invoices', { params });
      return res.data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const res = await api.get('/settings'); return res.data; },
  });

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  if (isLoading) return <Spinner className="py-24" />;

  const invoices: Invoice[] = data?.data || [];
  const pagination = data?.pagination;
  const currency = settings?.currency || 'EGP';
  const canCreate = user?.role === 'OWNER' || user?.role === 'SECRETARY';
  const canPay = user?.role === 'OWNER' || user?.role === 'SECRETARY';

  const statusLabels: Record<string, string> = {
    UNPAID: t('unpaid'), PARTIALLY_PAID: t('partiallyPaid'), PAID: t('paid'),
    OVERDUE: t('overdue'), CANCELLED: t('cancelled'),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('invoices')}
          subtitle={`${pagination?.total || 0} ${L(ar.invoiceCount, 'invoices')}`}
          action={
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="input !w-auto"
              >
                <option value="">{L(ar.allStatuses, 'All statuses')}</option>
                <option value="UNPAID">{t('unpaid')}</option>
                <option value="PARTIALLY_PAID">{t('partiallyPaid')}</option>
                <option value="PAID">{t('paid')}</option>
                <option value="OVERDUE">{t('overdue')}</option>
              </select>
              {canCreate && (
                <button onClick={() => setShowInvoiceForm(!showInvoiceForm)} className="btn-primary">
                  <Plus size={16} />
                  {L(ar.newInvoice, 'New Invoice')}
                </button>
              )}
            </div>
          }
        />

        {showInvoiceForm && <NewInvoiceForm onClose={() => setShowInvoiceForm(false)} currency={currency} />}
        {paymentFor && <PaymentForm invoice={paymentFor} currency={currency} onClose={() => setPaymentFor(null)} />}

        {invoices.length === 0 ? (
          <EmptyState message={t('noData')} />
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map((inv) => {
              const totalPaid = (inv.payments || [])
                .filter((p) => p.status === 'COMPLETED')
                .reduce((sum, p) => sum + Number(p.amount), 0);
              const remaining = Number(inv.total) - totalPaid;

              return (
                <div key={inv.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{inv.number}</p>
                      <p className="text-sm text-gray-500">{inv.patient.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="font-semibold text-gray-900">{Number(inv.total).toFixed(0)} {currency}</p>
                      {remaining > 0 && (
                        <p className="text-xs text-red-500">
                          {L(ar.remaining, 'Remaining')}: {remaining.toFixed(0)} {currency}
                        </p>
                      )}
                    </div>
                    <Badge status={inv.status}>{statusLabels[inv.status] || inv.status}</Badge>
                    {canPay && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && remaining > 0 && (
                      <button onClick={() => setPaymentFor(inv)} className="btn-primary !py-1.5 !px-3 text-xs">
                        <CreditCard size={14} />
                        {L(ar.pay, 'Pay')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

function NewInvoiceForm({ onClose, currency }: { onClose: () => void; currency: string }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const { data: patients } = useQuery({
    queryKey: ['patients-for-invoice'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 100 } });
      return res.data.data as any[];
    },
  });

  const [formData, setFormData] = useState({ patientId: '', amount: '' });

  const createInvoice = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/invoices', { patientId: data.patientId, amount: parseFloat(data.amount) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: (err: any) => { setError(err.response?.data?.message || 'Failed'); },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setError(null); createInvoice.mutate(formData); };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-primary-200 bg-primary-50/50 p-6">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t('patients')} *</label>
          <select value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="input" required>
            <option value="">{L(ar.selectPatient, 'Select patient')}</option>
            {(patients || []).map((p) => (
              <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{L(ar.amountLabel, 'Amount')} ({currency}) *</label>
          <input type="number" value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="input" required min="1" step="0.01" placeholder="300" />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
        <button type="submit" disabled={createInvoice.isPending} className="btn-primary">
          {createInvoice.isPending ? t('loading') : t('save')}
        </button>
      </div>
    </form>
  );
}

function PaymentForm({ invoice, currency, onClose }: { invoice: Invoice; currency: string; onClose: () => void }) {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const totalPaid = (invoice.payments || [])
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(invoice.total) - totalPaid;

  const recordPayment = useMutation({
    mutationFn: async () => {
      await api.post('/invoices/payments', { invoiceId: invoice.id, amount: parseFloat(amount), method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onClose();
    },
    onError: (err: any) => { setError(err.response?.data?.message || 'Payment failed'); },
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setError(null); recordPayment.mutate(); };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6">
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}
      <h3 className="mb-4 text-lg font-semibold">
        {L(ar.recordPayment, 'Record Payment')} - {invoice.number}
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        {L(ar.remaining, 'Remaining')}: {remaining.toFixed(0)} {currency}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{L(ar.amountLabel, 'Amount')} ({currency}) *</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="input" required min="1" max={remaining} step="0.01" placeholder={String(remaining)} />
        </div>
        <div>
          <label className="label">{L(ar.paymentMethod, 'Payment Method')}</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="input">
            <option value="CASH">{L(ar.cash, 'Cash')}</option>
            <option value="CARD">{L(ar.card, 'Card')}</option>
            <option value="BANK_TRANSFER">{L(ar.bankTransfer, 'Bank Transfer')}</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
        <button type="submit" disabled={recordPayment.isPending} className="btn-primary">
          <DollarSign size={16} />
          {recordPayment.isPending ? t('loading') : L(ar.confirmPayment, 'Confirm Payment')}
        </button>
      </div>
    </form>
  );
}
'@
Save-File "frontend\src\pages\Invoices.tsx" $invoicesPage

# ── Settings page ──
 $settingsPage = @'
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Save, Building2, DollarSign, Phone, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { ar } from '../ar';
import { Card, CardHeader, Spinner } from '../components/ui';

export default function Settings() {
  const { t, lang } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const res = await api.get('/settings'); return res.data; },
  });

  const [formData, setFormData] = useState({
    centerName: '', phone: '', email: '', address: '', googleMapsLink: '',
    sessionPrice: '', currency: 'EGP', taxRate: '0', whatsappMessageTemplate: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        centerName: settings.centerName || '', phone: settings.phone || '',
        email: settings.email || '', address: settings.address || '',
        googleMapsLink: settings.googleMapsLink || '',
        sessionPrice: String(settings.sessionPrice || ''),
        currency: settings.currency || 'EGP', taxRate: String(settings.taxRate || '0'),
        whatsappMessageTemplate: settings.whatsappMessageTemplate || '',
      });
    }
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async (data: any) => {
      await api.put('/settings', {
        centerName: data.centerName, phone: data.phone || null, email: data.email || null,
        address: data.address || null, googleMapsLink: data.googleMapsLink || null,
        sessionPrice: parseFloat(data.sessionPrice) || 0, currency: data.currency,
        taxRate: parseFloat(data.taxRate) || 0, whatsappMessageTemplate: data.whatsappMessageTemplate || null,
      });
    },
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
    onError: (err: any) => { setError(err.response?.data?.message || 'Failed to save'); },
  });

  if (isLoading) return <Spinner className="py-24" />;

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setError(null); saveSettings.mutate(formData); };

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardHeader title={t('settings')} subtitle={L(ar.centerConfig, 'Physio Center configuration')} />

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}
        {saved && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {L(ar.settingsSaved, 'Settings saved successfully')}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Building2 size={16} /> {L(ar.centerInfo, 'Center Information')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">{L(ar.centerNameLabel, 'Center Name')} *</label>
                <input type="text" value={formData.centerName}
                  onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                  className="input" required />
              </div>
              <div>
                <label className="label">{t('phone')}</label>
                <input type="tel" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input" dir="ltr" />
              </div>
              <div>
                <label className="label">{t('email')}</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input" />
              </div>
              <div>
                <label className="label">{L(ar.addressLabel, 'Address')}</label>
                <input type="text" value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">{L(ar.googleMapsLabel, 'Google Maps Link')}</label>
                <input type="url" value={formData.googleMapsLink}
                  onChange={(e) => setFormData({ ...formData, googleMapsLink: e.target.value })}
                  className="input" dir="ltr" placeholder="https://maps.google.com/..." />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <DollarSign size={16} /> {L(ar.financialSettings, 'Financial Settings')}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="label">{L(ar.sessionPriceLabel, 'Session Price')}</label>
                <input type="number" value={formData.sessionPrice}
                  onChange={(e) => setFormData({ ...formData, sessionPrice: e.target.value })}
                  className="input" min="0" step="0.01" />
              </div>
              <div>
                <label className="label">{L(ar.currencyLabel, 'Currency')}</label>
                <select value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="input">
                  <option value="EGP">EGP</option><option value="USD">USD</option>
                  <option value="EUR">EUR</option><option value="SAR">SAR</option>
                </select>
              </div>
              <div>
                <label className="label">{L(ar.taxRateLabel, 'Tax Rate %')}</label>
                <input type="number" value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="input" min="0" max="100" step="0.5" />
              </div>
            </div>
          </section>

          <section>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Phone size={16} /> {L(ar.whatsappTemplateLabel, 'WhatsApp Message Template')}
            </h3>
            <div>
              <textarea value={formData.whatsappMessageTemplate}
                onChange={(e) => setFormData({ ...formData, whatsappMessageTemplate: e.target.value })}
                className="input" rows={3}
                placeholder={'Hello {patient_name}, reminder for your appointment on {date_time} at {center_name}.'} />
              <p className="mt-2 text-xs text-gray-400">{L(ar.templateHint, 'Use: {patient_name}, {date_time}, {center_name}')}</p>
            </div>
          </section>

          <div className="flex justify-end border-t border-gray-100 pt-4">
            <button type="submit" disabled={saveSettings.isPending} className="btn-primary">
              <Save size={16} />
              {saveSettings.isPending ? t('loading') : L(ar.saveSettingsLabel, 'Save Settings')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
'@
Save-File "frontend\src\pages\Settings.tsx" $settingsPage

Write-Host ""
Write-Host "=== DONE - Arabic is now encoding-proof ===" -ForegroundColor Green
Write-Host ""
Write-Host "  Restart: cd frontend && pnpm dev" -ForegroundColor Cyan