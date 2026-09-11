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
  const sessionPrice = settings?.sessionPrice || 300;
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

        {showInvoiceForm && <NewInvoiceForm onClose={() => setShowInvoiceForm(false)} currency={currency} sessionPrice={sessionPrice} />}
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
                      <p className="font-medium text-gray-900 dark:text-gray-100">{inv.number}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{inv.patient.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{Number(inv.total).toFixed(0)} {currency}</p>
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

function NewInvoiceForm({ onClose, currency, sessionPrice }: { onClose: () => void; currency: string; sessionPrice: number }) {
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

  const [formData, setFormData] = useState({ patientId: '', amount: String(sessionPrice) });

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
            className="input" required min="1" step="0.01" placeholder={String(sessionPrice)} />
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
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
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