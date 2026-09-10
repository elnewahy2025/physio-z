// frontend/src/pages/Inventory.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Package, TrendingDown, AlertTriangle, ArrowUp, ArrowDown, Trash2, X,
  AlertCircle, Loader2, ShoppingCart, Boxes,
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, StatCard, EmptyState, Badge } from '../components/ui';

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  SUPPLIES: { ar: 'مستلزمات', en: 'Supplies' },
  MEDICATION: { ar: 'أدوية', en: 'Medication' },
  EQUIPMENT_PARTS: { ar: 'قطع غيار', en: 'Equipment Parts' },
  OFFICE: { ar: 'مكتبي', en: 'Office' },
  CLEANING: { ar: 'نظافة', en: 'Cleaning' },
};

export default function Inventory() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showStock, setShowStock] = useState<string | null>(null); // Item ID for stock adjustment
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const res = await api.get('/inventory/stats');
      return res.data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory', categoryFilter],
    queryFn: async () => {
      const res = await api.get('/inventory', {
        params: { category: categoryFilter || undefined },
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
  const currency = settings?.currency || 'EGP';

  if (isLoading) {
    return (
      <Card>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </Card>
    );
  }

  const getStockStatus = (item: any) => {
    if (item.quantity === 0) return { color: 'bg-red-100 text-red-700', label: L('نفذ', 'Out'), level: 'out' };
    if (item.quantity <= item.minQuantity) return { color: 'bg-yellow-100 text-yellow-700', label: L('منخفض', 'Low'), level: 'low' };
    return { color: 'bg-green-100 text-green-700', label: L('متوفر', 'In Stock'), level: 'ok' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('المخزون', 'Inventory')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {L('إدارة المخزون والتنبيهات', 'Manage stock and alerts')}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          {L('إضافة عنصر', 'Add Item')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard
          title={L('إجمالي العناصر', 'Total Items')}
          value={stats?.totalItems || 0}
          icon={<Boxes size={24} />}
          color="primary"
        />
        <StatCard
          title={L('مخزون منخفض', 'Low Stock')}
          value={stats?.lowStockItems || 0}
          icon={<AlertTriangle size={24} />}
          color="yellow"
        />
        <StatCard
          title={L('نفذ المخزون', 'Out of Stock')}
          value={stats?.outOfStockItems || 0}
          icon={<TrendingDown size={24} />}
          color="red"
        />
        <StatCard
          title={L('قيمة المخزون', 'Stock Value')}
          value={`${(stats?.totalValue || 0).toFixed(0)} ${currency}`}
          icon={<Package size={24} />}
          color="green"
        />
      </div>

      {/* Add form */}
      {showAdd && (
        <AddInventoryForm
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
          }}
        />
      )}

      {/* Stock adjustment modal */}
      {showStock && (
        <StockAdjustmentModal
          itemId={showStock}
          onClose={() => setShowStock(null)}
          onSuccess={() => {
            setShowStock(null);
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
          }}
        />
      )}

      {/* Item list */}
      <Card>
        <CardHeader
          title={L('عناصر المخزون', 'Inventory Items')}
          subtitle={`${(items || []).length} ${L('عنصر', 'items')}`}
          action={
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input !w-auto !py-1.5 text-sm"
            >
              <option value="">{L('كل الفئات', 'All categories')}</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {lang === 'ar' ? label.ar : label.en}
                </option>
              ))}
            </select>
          }
        />

        {(items || []).length === 0 ? (
          <EmptyState
            icon={<Package size={32} />}
            title={L('لا توجد عناصر', 'No items')}
            subtitle={L('أضف عنصرك الأول', 'Add your first item')}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {(items || []).map((item: any) => {
              const stockStatus = getStockStatus(item);
              return (
                <div key={item.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stockStatus.color}`}>
                      <Package size={20} />
                    </div>

                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>
                          {lang === 'ar' ? CATEGORY_LABELS[item.category]?.ar : CATEGORY_LABELS[item.category]?.en}
                        </span>
                        <span>·</span>
                        <span>{item.quantity} {item.unit}</span>
                        {item.location && (
                          <>
                            <span>·</span>
                            <span>{item.location}</span>
                          </>
                        )}
                      </div>
                      {item.supplier && (
                        <p className="text-xs text-gray-400">
                          {L('المورد', 'Supplier')}: {item.supplier}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Stock status badge */}
                    <span className={`badge ${stockStatus.color}`}>
                      {stockStatus.label}
                    </span>

                    {/* Quantity display */}
                    <div className="text-end">
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {item.quantity}
                      </p>
                      <p className="text-xs text-gray-400">
                        {L('حد أدنى', 'min')}: {item.minQuantity}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowStock(item.id)}
                        className="rounded-lg p-2 text-blue-500 hover:bg-blue-50"
                        title={L('تعديل المخزون', 'Adjust Stock')}
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
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

// ─── Add Inventory Item Form ───
function AddInventoryForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'SUPPLIES',
    unit: 'piece',
    quantity: 0,
    minQuantity: 5,
    unitCost: '',
    supplier: '',
    location: '',
    notes: '',
  });

  const createItem = useMutation({
    mutationFn: async () => {
      await api.post('/inventory', {
        ...formData,
        unitCost: formData.unitCost ? parseFloat(formData.unitCost) : undefined,
        supplier: formData.supplier || undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
      });
    },
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError(L('أدخل اسم العنصر', 'Enter item name'));
      return;
    }
    setError(null);
    createItem.mutate();
  };

  return (
    <Card>
      <CardHeader
        title={L('إضافة عنصر للمخزون', 'Add Inventory Item')}
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
              minLength={2}
              placeholder={L('أشرطة مطاطية', 'Resistance bands')}
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
            <label className="label">{L('الوحدة', 'Unit')} *</label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="input"
            >
              <option value="piece">{L('قطعة', 'Piece')}</option>
              <option value="box">{L('صندوق', 'Box')}</option>
              <option value="bottle">{L('زجاجة', 'Bottle')}</option>
              <option value="roll">{L('لفة', 'Roll')}</option>
              <option value="pack">{L('عبوة', 'Pack')}</option>
            </select>
          </div>

          <div>
            <label className="label">{L('الكمية الحالية', 'Current Quantity')}</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="input"
              min={0}
            />
          </div>

          <div>
            <label className="label">{L('الحد الأدنى', 'Minimum Quantity')}</label>
            <input
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
              className="input"
              min={0}
            />
          </div>

          <div>
            <label className="label">{L('تكلفة الوحدة', 'Unit Cost')}</label>
            <input
              type="number"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              className="input"
              min={0}
              step="0.01"
              placeholder="50"
            />
          </div>

          <div>
            <label className="label">{L('المورد', 'Supplier')}</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">{L('الموقع', 'Location')}</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="input"
              placeholder={L('غرفة 1، مخزن...', 'Room 1, Storage...')}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            {L('إلغاء', 'Cancel')}
          </button>
          <button type="submit" disabled={createItem.isPending} className="btn-primary">
            {createItem.isPending ? <Loader2 size={16} className="animate-spin" /> : L('إضافة', 'Add')}
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Stock Adjustment Modal ───
function StockAdjustmentModal({
  itemId,
  onClose,
  onSuccess,
}: {
  itemId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const { data: item } = useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: async () => {
      const res = await api.get('/inventory');
      return (res.data as any[]).find((i) => i.id === itemId);
    },
  });

  const { data: history } = useQuery({
    queryKey: ['inventory-history', itemId],
    queryFn: async () => {
      const res = await api.get(`/inventory/${itemId}/history`);
      return res.data;
    },
  });

  const adjustStock = useMutation({
    mutationFn: async () => {
      await api.post('/inventory/transaction', {
        itemId,
        type,
        quantity: parseInt(quantity),
        reason: reason || undefined,
      });
    },
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || parseInt(quantity) <= 0) {
      setError(L('أدخل كمية صحيحة', 'Enter valid quantity'));
      return;
    }
    setError(null);
    adjustStock.mutate();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={onClose}
          className="absolute end-4 top-4 rounded-lg p-2 text-gray-400 hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          {item?.name || L('تعديل المخزون', 'Adjust Stock')}
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {L('الكمية الحالية', 'Current quantity')}: {item?.quantity} {item?.unit}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Transaction type */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('IN')}
              className={`
                flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all
                ${type === 'IN'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500'
                }
              `}
            >
              <ArrowDown size={16} className="rotate-180" />
              {L('إضافة مخزون', 'Stock In')}
            </button>
            <button
              type="button"
              onClick={() => setType('OUT')}
              className={`
                flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all
                ${type === 'OUT'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-500'
                }
              `}
            >
              <ArrowDown size={16} />
              {L('استخدام مخزون', 'Stock Out')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{L('الكمية', 'Quantity')} *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input"
                required
                min={1}
                placeholder="10"
              />
            </div>

            <div>
              <label className="label">{L('السبب', 'Reason')}</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
                placeholder={type === 'IN' ? L('إعادة تخزين', 'Restock') : L('استخدام', 'Used')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={adjustStock.isPending}
            className={`btn-primary w-full ${type === 'OUT' ? '!bg-red-600 hover:!bg-red-700' : ''}`}
          >
            {adjustStock.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              type === 'IN' ? L('إضافة للمخزون', 'Add to Stock') : L('خصم من المخزون', 'Remove from Stock')
            )}
          </button>
        </form>

        {/* Transaction history */}
        {(history || []).length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              {L('سجل الحركة', 'Transaction History')}
            </p>
            <div className="max-h-40 space-y-2 overflow-y-auto">
              {(history || []).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${tx.type === 'IN' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-gray-600">
                      {new Date(tx.date).toLocaleDateString()} — {tx.reason || tx.type}
                    </span>
                  </div>
                  <span className={`font-medium ${tx.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}