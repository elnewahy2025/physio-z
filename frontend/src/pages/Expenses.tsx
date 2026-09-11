// frontend/src/pages/Expenses.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, DollarSign, TrendingUp, TrendingDown, Calendar,
  AlertCircle, X, Loader2, Filter,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, StatCard, EmptyState, Badge } from '../components/ui';

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#6b7280'];

const CATEGORY_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  RENT: { ar: 'إيجار', en: 'Rent', color: 'bg-blue-50 text-blue-700' },
  SALARIES: { ar: 'رواتب', en: 'Salaries', color: 'bg-green-50 text-green-700' },
  SUPPLIES: { ar: 'مستلزمات', en: 'Supplies', color: 'bg-yellow-50 text-yellow-700' },
  UTILITIES: { ar: 'مرافق', en: 'Utilities', color: 'bg-purple-50 text-purple-700' },
  EQUIPMENT: { ar: 'أجهزة', en: 'Equipment', color: 'bg-red-50 text-red-700' },
  MARKETING: { ar: 'تسويق', en: 'Marketing', color: 'bg-teal-50 text-teal-700' },
  MAINTENANCE: { ar: 'صيانة', en: 'Maintenance', color: 'bg-orange-50 text-orange-700' },
  OTHER: { ar: 'أخرى', en: 'Other', color: 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300' },
};

export default function Expenses() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Date range (default: current month)
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['expense-stats', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/expenses/stats', { params: { startDate, endDate } });
      return res.data;
    },
  });

  const { data: expenses, isLoading: listLoading } = useQuery({
    queryKey: ['expenses', startDate, endDate, categoryFilter],
    queryFn: async () => {
      const res = await api.get('/expenses', {
        params: { startDate, endDate, category: categoryFilter || undefined },
      });
      return res.data;
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  if (statsLoading) {
    return (
      <Card>
        <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </Card>
    );
  }

  const currency = settings?.currency || 'EGP';

  const categoryData = Object.entries(stats?.byCategory || {}).map(([cat, amount]) => ({
    name: lang === 'ar' ? CATEGORY_LABELS[cat]?.ar || cat : CATEGORY_LABELS[cat]?.en || cat,
    value: Math.round(amount as number),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {L('المصروفات', 'Expenses')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {L('تتبع جميع مصروفات المركز', 'Track all center expenses')}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} />
          {L('مصروف جديد', 'Add Expense')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={L('إجمالي المصروفات', 'Total Expenses')}
          value={`${(stats?.totals?.total || 0).toFixed(0)} ${currency}`}
          icon={<TrendingDown size={24} />}
          color="red"
        />
        <StatCard
          title={L('عدد المصروفات', 'Count')}
          value={stats?.totals?.count || 0}
          icon={<Calendar size={24} />}
          color="primary"
        />
        <StatCard
          title={L('متوسط المصروف', 'Average')}
          value={`${(stats?.totals?.average || 0).toFixed(0)} ${currency}`}
          icon={<DollarSign size={24} />}
          color="yellow"
        />
      </div>

      {/* Add form */}
      {showAdd && (
        <AddExpenseForm
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
          }}
        />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={L('المصروفات حسب الفئة', 'Expenses by Category')} />
          {categoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ${currency}`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={L('لا توجد بيانات', 'No data')} />
          )}
        </Card>

        <Card>
          <CardHeader title={L('المصروفات الشهرية', 'Monthly Expenses')} />
          {(stats?.byMonth || []).length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value} ${currency}`, '']} />
                  <Bar dataKey="amount" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState message={L('لا توجد بيانات', 'No data')} />
          )}
        </Card>
      </div>

      {/* Expense list */}
      <Card>
        <CardHeader
          title={L('قائمة المصروفات', 'Expense List')}
          action={
            <div className="flex items-center gap-3">
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
            </div>
          }
        />

        {listLoading ? (
          <div className="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        ) : (expenses || []).length === 0 ? (
          <EmptyState
            icon={<DollarSign size={32} />}
            title={L('لا توجد مصروفات', 'No expenses')}
            subtitle={L('أضف مصروفك الأول', 'Add your first expense')}
          />
        ) : (
          <div className="divide-y divide-gray-100">
            {(expenses || []).map((expense: any) => (
              <div key={expense.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${CATEGORY_LABELS[expense.category]?.color || 'bg-gray-50 dark:bg-gray-900'}`}>
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {expense.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{new Date(expense.date).toLocaleDateString()}</span>
                      <span>{lang === 'ar' ? CATEGORY_LABELS[expense.category]?.ar : CATEGORY_LABELS[expense.category]?.en}</span>
                      {expense.paymentMethod && <span>{expense.paymentMethod}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-red-600">
                    -{Number(expense.amount).toFixed(0)} {currency}
                  </span>
                  <button
                    onClick={() => deleteExpense.mutate(expense.id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Add Expense Form ───
function AddExpenseForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: 'SUPPLIES',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    notes: '',
  });

  const createExpense = useMutation({
    mutationFn: async () => {
      await api.post('/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString(),
        notes: formData.notes || undefined,
      });
    },
    onSuccess,
    onError: (err: any) => setError(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      setError(L('املأ الحقول المطلوبة', 'Fill required fields'));
      return;
    }
    setError(null);
    createExpense.mutate();
  };

  return (
    <Card>
      <CardHeader
        title={L('إضافة مصروف', 'Add Expense')}
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
            <label className="label">{L('الفئة', 'Category')} *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              required
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {lang === 'ar' ? label.ar : label.en}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{L('المبلغ', 'Amount')} *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
              required
              min={1}
              step="0.01"
              placeholder="500"
            />
          </div>

          <div>
            <label className="label">{L('الوصف', 'Description')} *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              required
              minLength={2}
              placeholder={L('إيجار شهر أكتوبر', 'October rent')}
            />
          </div>

          <div>
            <label className="label">{L('التاريخ', 'Date')} *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">{L('طريقة الدفع', 'Payment Method')}</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="input"
            >
              <option value="CASH">{L('نقدي', 'Cash')}</option>
              <option value="BANK_TRANSFER">{L('تحويل بنكي', 'Bank Transfer')}</option>
              <option value="CARD">{L('بطاقة', 'Card')}</option>
              <option value="CHEQUE">{L('شيك', 'Cheque')}</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="label">{L('ملاحظات', 'Notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            {L('إلغاء', 'Cancel')}
          </button>
          <button type="submit" disabled={createExpense.isPending} className="btn-primary">
            {createExpense.isPending ? <Loader2 size={16} className="animate-spin" /> : L('حفظ', 'Save')}
          </button>
        </div>
      </form>
    </Card>
  );
}