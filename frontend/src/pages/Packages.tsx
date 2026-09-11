// frontend/src/pages/Packages.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, DollarSign, Users, Trash2, Pencil, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { Card, CardHeader, EmptyState, StatCard } from '../components/ui';

export default function Packages() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showSell, setShowSell] = useState<string | null>(null); // Package ID to sell
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

      {/* Package list */}
      {list.length === 0 ? (
        <Card>
          <EmptyState
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
              {(pkg.patientPackages?.length || 0) > 5 && (
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
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <Users size={14} />
                <span>
                  {pkg.patientPackages?.length || 0} {L('مريض اشتروا هذه الباقة', 'patients purchased')}
                </span>
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