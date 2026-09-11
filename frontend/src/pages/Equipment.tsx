// frontend/src/pages/Equipment.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Wrench, AlertTriangle, Clock, CheckCircle, DollarSign,
  X, ChevronDown, ChevronUp, Trash2, AlertCircle, Loader2,
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, StatCard, EmptyState, Badge } from '../components/ui';

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  TREATMENT: { ar: 'علاجي', en: 'Treatment' },
  DIAGNOSTIC: { ar: 'تشخيصي', en: 'Diagnostic' },
  EXERCISE: { ar: 'تمارين', en: 'Exercise' },
  FURNITURE: { ar: 'أثاث', en: 'Furniture' },
  OTHER: { ar: 'أخرى', en: 'Other' },
};

const MAINTENANCE_TYPES: Record<string, { ar: string; en: string }> = {
  ROUTINE: { ar: 'صيانة دورية', en: 'Routine' },
  REPAIR: { ar: 'إصلاح', en: 'Repair' },
  INSPECTION: { ar: 'فحص', en: 'Inspection' },
  CALIBRATION: { ar: 'معايرة', en: 'Calibration' },
};

export default function Equipment() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['equipment-stats'],
    queryFn: async () => {
      const res = await api.get('/equipment/stats');
      return res.data;
    },
  });

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      const res = await api.get('/equipment');
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
  const currency = settings?.currency || 'EGP';

  if (isLoading) {
    return (
      <Card>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('الأجهزة والصيانة', 'Equipment & Maintenance')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {L('إدارة الأجهزة وجدولة الصيانة', 'Manage equipment and maintenance schedule')}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          {L('إضافة جهاز', 'Add Equipment')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          title={L('إجمالي الأجهزة', 'Total Equipment')}
          value={stats?.totalEquipment || 0}
          icon={<Wrench size={24} />}
          color="primary"
        />
        <StatCard
          title={L('صيانة متأخرة', 'Overdue')}
          value={stats?.overdueMaintenance || 0}
          icon={<AlertTriangle size={24} />}
          color="red"
        />
        <StatCard
          title={L('صيانة قريبة', 'Due Soon')}
          value={stats?.dueSoon || 0}
          icon={<Clock size={24} />}
          color="yellow"
        />
        <StatCard
          title={L('إجمالي تكلفة الصيانة', 'Maintenance Cost')}
          value={`${(stats?.totalMaintenanceCost || 0).toFixed(0)} ${currency}`}
          icon={<DollarSign size={24} />}
          color="green"
        />
      </div>

      {/* Add form */}
      {showAdd && (
        <AddEquipmentForm
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
          }}
        />
      )}

      {/* Maintenance modal */}
      {showMaintenance && (
        <MaintenanceModal
          equipmentId={showMaintenance}
          onClose={() => setShowMaintenance(null)}
          onSuccess={() => {
            setShowMaintenance(null);
            queryClient.invalidateQueries({ queryKey: ['equipment'] });
            queryClient.invalidateQueries({ queryKey: ['equipment-stats'] });
          }}
        />
      )}

      {/* Equipment list */}
      <Card>
        <CardHeader
          title={L('الأجهزة', 'Equipment')}
          subtitle={`${(equipment || []).length} ${L('جهاز', 'devices')}`}
        />

        {(equipment || []).length === 0 ? (
          <EmptyState
            icon={<Wrench size={32} />}
            title={L('لا توجد أجهزة', 'No equipment')}
            subtitle={L('أضف جهازك الأول', 'Add your first equipment')}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {(equipment || []).map((eq: any) => (
              <div key={eq.id} className="py-4">
                {/* Equipment row */}
                <button
                  onClick={() => setExpandedId(expandedId === eq.id ? null : eq.id)}
                  className="flex w-full items-center justify-between text-start"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        eq.maintenanceStatus === 'OVERDUE'
                          ? 'bg-red-50 text-red-600'
                          : eq.maintenanceStatus === 'DUE_SOON'
                            ? 'bg-yellow-50 text-yellow-600'
                            : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <Wrench size={20} />
                    </div>

                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{eq.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>
                          {lang === 'ar' ? CATEGORY_LABELS[eq.category]?.ar : CATEGORY_LABELS[eq.category]?.en}
                        </span>
                        {eq.room && <span>· {L('غرفة', 'Room')} {eq.room.number}</span>}
                        {eq.serialNumber && <span>· S/N: {eq.serialNumber}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Maintenance status */}
                    {eq.maintenanceStatus === 'OVERDUE' && (
                      <Badge status="OVERDUE">{L('متأخرة', 'Overdue')}</Badge>
                    )}
                    {eq.maintenanceStatus === 'DUE_SOON' && (
                      <Badge status="PENDING">{L('قريباً', 'Due Soon')}</Badge>
                    )}
                    {eq.maintenanceStatus === 'OK' && (
                      <Badge status="COMPLETED">{L('جيدة', 'OK')}</Badge>
                    )}

                    {expandedId === eq.id ? (
                      <ChevronUp size={18} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={18} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {expandedId === eq.id && (
                  <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-gray-500">{L('آخر صيانة', 'Last Maintenance')}</p>
                        <p className="mt-1 text-sm font-medium">
                          {eq.lastMaintenanceDate
                            ? new Date(eq.lastMaintenanceDate).toLocaleDateString()
                            : L('لم تتم', 'Never')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{L('فاصل الصيانة', 'Interval')}</p>
                        <p className="mt-1 text-sm font-medium">
                          {eq.maintenanceIntervalDays
                            ? `${eq.maintenanceIntervalDays} ${L('يوم', 'days')}`
                            : L('غير محدد', 'Not set')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{L('تكلفة الشراء', 'Purchase Cost')}</p>
                        <p className="mt-1 text-sm font-medium">
                          {eq.purchaseCost ? `${Number(eq.purchaseCost).toFixed(0)} ${currency}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{L('الحالة', 'Status')}</p>
                        <p className="mt-1 text-sm font-medium">{eq.status}</p>
                      </div>
                    </div>

                    {/* Log maintenance button */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setShowMaintenance(eq.id)}
                        className="btn-primary !py-2 !px-4 text-sm"
                      >
                        <Wrench size={14} />
                        {L('تسجيل صيانة', 'Log Maintenance')}
                      </button>
                    </div>

                    {/* Maintenance history */}
                    <MaintenanceHistory equipmentId={eq.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Add Equipment Form ───
function AddEquipmentForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'TREATMENT',
    serialNumber: '',
    purchaseCost: '',
    maintenanceIntervalDays: '90',
    notes: '',
  });

  const { data: rooms } = useQuery({
    queryKey: ['equipment-rooms'],
    queryFn: async () => {
      const res = await api.get('/rooms');
      return res.data;
    },
  });

  const createEquipment = useMutation({
    mutationFn: async () => {
      await api.post('/equipment', {
        ...formData,
        serialNumber: formData.serialNumber || undefined,
        purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
        maintenanceIntervalDays: formData.maintenanceIntervalDays
          ? parseInt(formData.maintenanceIntervalDays)
          : undefined,
        notes: formData.notes || undefined,
      });
    },
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError(L('أدخل اسم الجهاز', 'Enter equipment name'));
      return;
    }
    setError(null);
    createEquipment.mutate();
  };

  return (
    <Card>
      <CardHeader
        title={L('إضافة جهاز', 'Add Equipment')}
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
            <label className="label">{L('الاسم', 'Name')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              placeholder={L('جهاز موجات فوق صوتية', 'Ultrasound Machine')}
            />
          </div>

          <div>
            <label className="label">{L('الفئة', 'Category')} *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {lang === 'ar' ? label.ar : label.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{L('الرقم التسلسلي', 'Serial Number')}</label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="input"
              dir="ltr"
            />
          </div>

          <div>
            <label className="label">{L('تكلفة الشراء', 'Purchase Cost')}</label>
            <input
              type="number"
              value={formData.purchaseCost}
              onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
              className="input"
              min={0}
              step="0.01"
            />
          </div>

          <div>
            <label className="label">{L('فاصل الصيانة (يوم)', 'Maintenance Interval (days)')}</label>
            <input
              type="number"
              value={formData.maintenanceIntervalDays}
              onChange={(e) => setFormData({ ...formData, maintenanceIntervalDays: e.target.value })}
              className="input"
              min={7}
              placeholder="90"
            />
          </div>

          <div>
            <label className="label">{L('ملاحظات', 'Notes')}</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            {L('إلغاء', 'Cancel')}
          </button>
          <button type="submit" disabled={createEquipment.isPending} className="btn-primary">
            {createEquipment.isPending ? <Loader2 size={16} className="animate-spin" /> : L('إضافة', 'Add')}
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Log Maintenance Modal ───
function MaintenanceModal({
  equipmentId,
  onClose,
  onSuccess,
}: {
  equipmentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'ROUTINE',
    description: '',
    cost: '',
    performedBy: '',
    nextDueInDays: '',
  });

  const logMaintenance = useMutation({
    mutationFn: async () => {
      await api.post('/equipment/maintenance', {
        equipmentId,
        type: formData.type,
        description: formData.description,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        performedBy: formData.performedBy || undefined,
        nextDueInDays: formData.nextDueInDays ? parseInt(formData.nextDueInDays) : undefined,
      });
    },
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) {
      setError(L('أدخل وصف الصيانة', 'Enter maintenance description'));
      return;
    }
    setError(null);
    logMaintenance.mutate();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute end-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        <h2 className="mb-4 text-xl font-bold">{L('تسجيل صيانة', 'Log Maintenance')}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label">{L('نوع الصيانة', 'Type')} *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input"
            >
              {Object.entries(MAINTENANCE_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {lang === 'ar' ? label.ar : label.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{L('الوصف', 'Description')} *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              required
              rows={2}
              placeholder={L('تفاصيل ما تم عمله...', 'What was done...')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{L('التكلفة', 'Cost')}</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="input"
                min={0}
                step="0.01"
              />
            </div>

            <div>
              <label className="label">{L('نفذ بواسطة', 'Performed By')}</label>
              <input
                type="text"
                value={formData.performedBy}
                onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
                className="input"
                placeholder={L('اسم الفني', 'Technician name')}
              />
            </div>
          </div>

          <div>
            <label className="label">{L('الصيانة القادمة بعد (يوم)', 'Next maintenance in (days)')}</label>
            <input
              type="number"
              value={formData.nextDueInDays}
              onChange={(e) => setFormData({ ...formData, nextDueInDays: e.target.value })}
              className="input"
              min={7}
              placeholder="90"
            />
          </div>

          <button
            type="submit"
            disabled={logMaintenance.isPending}
            className="btn-primary w-full"
          >
            {logMaintenance.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              L('تسجيل', 'Log Maintenance')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Maintenance History Component ───
function MaintenanceHistory({ equipmentId }: { equipmentId: string }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data: history } = useQuery({
    queryKey: ['maintenance-history', equipmentId],
    queryFn: async () => {
      const res = await api.get(`/equipment/${equipmentId}/maintenance`);
      return res.data;
    },
  });

  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        {L('لا يوجد سجل صيانة', 'No maintenance history')}
      </p>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-gray-700">
        {L('سجل الصيانة', 'Maintenance History')}
      </p>
      <div className="space-y-2">
        {history.map((log: any) => (
          <div
            key={log.id}
            className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  log.type === 'ROUTINE' ? 'bg-blue-50 text-blue-600'
                  : log.type === 'REPAIR' ? 'bg-red-50 text-red-600'
                  : 'bg-yellow-50 text-yellow-600'
                }`}
              >
                <Wrench size={14} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(log.date).toLocaleDateString()} ·{' '}
                  {lang === 'ar' ? MAINTENANCE_TYPES[log.type]?.ar : MAINTENANCE_TYPES[log.type]?.en}
                  {log.performedBy && ` · ${log.performedBy}`}
                </p>
              </div>
            </div>
            {log.cost && (
              <span className="font-medium text-gray-600">
                {Number(log.cost).toFixed(0)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}