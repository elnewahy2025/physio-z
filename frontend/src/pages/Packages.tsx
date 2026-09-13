// frontend/src/pages/Packages.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, DollarSign, Users, Trash2, Pencil, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { Card, CardHeader, StatCard, EnhancedEmptyState } from '../components/ui';

export default function Packages() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showSell, setShowSell] = useState<string | null>(null); // Package ID to sell
  const [showPatients, setShowPatients] = useState<any | null>(null); // Package to show patients for
  const [error, setError] = useState<string | null>(null);

  const isOwner = user?.role === 'OWNER';

  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const res = await api.get('/packages', {
        params: isOwner ? { includeInactive: 'true' } : {},
      });
      return res.data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </Card>
    );
  }

  const currency = settings?.currency || 'EGP';
  const list = packages || [];
  const activePackages = list.filter((p: any) => p.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('باقات العلاج', 'Treatment Packages')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {L('باقات جلسات بأسعار مخفضة', 'Session bundles at discounted prices')}
          </p>
        </div>

        {isOwner && (
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={16} />
            {L('باقة جديدة', 'New Package')}
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <CreatePackageForm
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            queryClient.invalidateQueries({ queryKey: ['packages'] });
          }}
        />
      )}

      {/* Sell package modal */}
      {showSell && (
        <SellPackageModal
          packageId={showSell}
          onClose={() => setShowSell(null)}
          onSuccess={() => {
            setShowSell(null);
            queryClient.invalidateQueries({ queryKey: ['packages'] });
          }}
        />
      )}

      {/* Patient List Modal */}
      {showPatients && (
        <PatientListModal
          pkg={showPatients}
          onClose={() => setShowPatients(null)}
        />
      )}

      {/* Package list */}
      {list.length === 0 ? (
        <Card>
          <EnhancedEmptyState
            icon={<Package size={32} />}
            title={L('لا توجد باقات', 'No packages')}
            subtitle={L('أنشئ باقتك الأولى', 'Create your first package')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((pkg: any) => (
            <div
              key={pkg.id}
              className={`
                card relative overflow-hidden
                ${!pkg.isActive && 'opacity-50'}
              `}
            >
              {/* Popular badge */}
              {(pkg._count?.patientPackages || 0) > 5 && (
                <div className="absolute end-3 top-3 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">
                  {L('الأكثر رواجاً', 'Popular')}
                </div>
              )}

              {/* Package name */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {pkg.name}
              </h3>

              {pkg.description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{pkg.description}</p>
              )}

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-primary-600">
                  {Number(pkg.price).toFixed(0)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{currency}</span>
              </div>

              {/* Session info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{L('عدد الجلسات', 'Sessions')}</span>
                  <span className="font-semibold">{pkg.sessionCount}</span>
                </div>

                {pkg.durationDays && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{L('صالحة لمدة', 'Valid for')}</span>
                    <span className="font-semibold">{pkg.durationDays} {L('يوم', 'days')}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{L('سعر الجلسة', 'Per session')}</span>
                  <span className="font-semibold text-green-600">
                    {(Number(pkg.price) / pkg.sessionCount).toFixed(0)} {currency}
                  </span>
                </div>
              </div>

              {/* Purchased count */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  <span>
                    {pkg._count?.patientPackages || 0} {L('مريض اشتروا هذه الباقة', 'patients purchased')}
                  </span>
                </div>
                {(pkg._count?.patientPackages || 0) > 0 && (
                  <button
                    onClick={() => setShowPatients(pkg)}
                    className="text-primary-600 hover:underline"
                  >
                    {L('عرض', 'View')}
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                {(user?.role === 'OWNER' || user?.role === 'SECRETARY') && pkg.isActive && (
                  <button
                    onClick={() => setShowSell(pkg.id)}
                    className="btn-primary flex-1 !py-2 text-sm"
                  >
                    {L('بيع الباقة', 'Sell Package')}
                  </button>
                )}

                {isOwner && (
                  <button
                    onClick={() => {
                      // Delete (deactivate) package
                      api.delete(`/packages/${pkg.id}`).then(() => {
                        queryClient.invalidateQueries({ queryKey: ['packages'] });
                      });
                    }}
                    className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Patient List Modal ───
function PatientListModal({ pkg, onClose }: { pkg: any; onClose: () => void }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const patients: any[] = pkg.patientPackages || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {L('المرضى المشتركين في', 'Patients enrolled in')} {pkg.name}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {patients.length} {L('اشتراك', 'enrollment(s)')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Patient list */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {patients.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              {L('لا يوجد مرضى بعد', 'No patients yet')}
            </p>
          ) : (
            <div className="space-y-3">
              {patients.map((pp: any, idx: number) => {
                const sessionsLeft = pp.sessionsTotal - pp.sessionsUsed;
                const pct = Math.round((pp.sessionsUsed / pp.sessionsTotal) * 100);
                const isExpired = pp.expiryDate && new Date(pp.expiryDate) < new Date();
                const statusColor =
                  pp.status === 'COMPLETED'
                    ? 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                    : isExpired
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-700';
                const statusLabel =
                  pp.status === 'COMPLETED'
                    ? L('مكتملة', 'Completed')
                    : isExpired
                      ? L('منتهية', 'Expired')
                      : L('نشطة', 'Active');

                return (
                  <div
                    key={pp.id || idx}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-700"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {pp.patient?.name || L('مريض محذوف', 'Deleted patient')}
                      </p>
                      {pp.patient?.phone && (
                        <p className="text-xs text-gray-400 mt-0.5">{pp.patient.phone}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {L('تاريخ الشراء:', 'Purchased:')} {new Date(pp.purchaseDate).toLocaleDateString()}
                        {pp.expiryDate && (
                          <span className="ms-2">
                            {L('| ينتهي:', '| Expires:')} {new Date(pp.expiryDate).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                      {/* Progress bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className="h-1.5 rounded-full bg-primary-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {pp.sessionsUsed}/{pp.sessionsTotal} {L('جلسة', 'sessions')}
                        </span>
                      </div>
                    </div>
                    <div className="ms-4 flex flex-col items-end gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                      <span className="text-xs text-gray-400">
                        {sessionsLeft} {L('متبقية', 'left')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 dark:border-gray-700">
          <button onClick={onClose} className="w-full btn-secondary">
            {L('إغلاق', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Package Form ───
function CreatePackageForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sessionCount: 10,
    price: 800,
    durationDays: 90,
  });

  const createPackage = useMutation({
    mutationFn: async () => {
      await api.post('/packages', {
        ...formData,
        description: formData.description || undefined,
        durationDays: formData.durationDays || undefined,
      });
    },
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createPackage.mutate();
  };

  return (
    <Card>
      <CardHeader
        title={L('إنشاء باقة جديدة', 'Create New Package')}
        action={
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{L('اسم الباقة', 'Package Name')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              minLength={2}
              placeholder={L('مثال: باقة 10 جلسات', 'e.g., 10-Session Package')}
            />
          </div>

          <div>
            <label className="label">{L('عدد الجلسات', 'Session Count')} *</label>
            <input
              type="number"
              value={formData.sessionCount}
              onChange={(e) => setFormData({ ...formData, sessionCount: parseInt(e.target.value) })}
              className="input"
              required
              min={1}
              max={100}
            />
          </div>

          <div>
            <label className="label">{L('السعر', 'Price')} *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              className="input"
              required
              min={1}
              step="0.01"
            />
          </div>

          <div>
            <label className="label">{L('مدة الصلاحية (يوم)', 'Duration (days)')}</label>
            <input
              type="number"
              value={formData.durationDays}
              onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 0 })}
              className="input"
              min={0}
              placeholder={L('فارغة = بلا انتهاء', 'empty = no expiry')}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label">{L('الوصف', 'Description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={2}
              placeholder={L('وصف الباقة والمزايا...', 'Package description and benefits...')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            {L('إلغاء', 'Cancel')}
          </button>
          <button type="submit" disabled={createPackage.isPending} className="btn-primary">
            {createPackage.isPending ? <Loader2 size={16} className="animate-spin" /> : L('إنشاء', 'Create')}
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Sell Package Modal ───
function SellPackageModal({
  packageId,
  onClose,
  onSuccess,
}: {
  packageId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [patientId, setPatientId] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: patients } = useQuery({
    queryKey: ['sell-patients'],
    queryFn: async () => {
      const res = await api.get('/patients', { params: { limit: 100 } });
      return res.data.data;
    },
  });

  const sellPackage = useMutation({
    mutationFn: async () => {
      await api.post('/packages/sell', {
        packageId,
        patientId,
        discountCode: discountCode || undefined,
      });
    },
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      setError(L('اختر مريض', 'Select a patient'));
      return;
    }
    setError(null);
    sellPackage.mutate();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute end-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        <h2 className="mb-4 text-xl font-bold">
          {L('بيع الباقة', 'Sell Package')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label">{L('المريض', 'Patient')} *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="input"
              required
            >
              <option value="">{L('اختر مريض', 'Select patient')}</option>
              {(patients || []).map((p: any) => (
                <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{L('كود الخصم (اختياري)', 'Discount Code (optional)')}</label>
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              className="input"
              placeholder="SAVE10"
            />
          </div>

          <button
            type="submit"
            disabled={sellPackage.isPending || !patientId}
            className="btn-primary w-full"
          >
            {sellPackage.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              L('بيع وإنشاء فاتورة', 'Sell & Create Invoice')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}