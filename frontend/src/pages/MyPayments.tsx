// frontend/src/pages/MyPayments.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Receipt,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { Card, CardHeader, Badge, EmptyState, Spinner, StatCard } from '../components/ui';
import { InvoicePdfButton, WhatsAppButton } from '../components/InvoiceActions';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  paymentDate: string;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: string | null;
  status: string;
  createdAt: string;
  patient: { id: string; name: string; phone: string };
  payments: Payment[];
}

export default function MyPayments() {
  const { t, lang } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data, isLoading } = useQuery({
    queryKey: ['my-invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { limit: 100 } });
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

  if (isLoading) return <Spinner className="py-24" />;

  const invoices: Invoice[] = data?.data || [];
  const currency = settings?.currency || 'EGP';
  const centerPhone = settings?.phone;

  // Calculate totals
  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const totalPaid = invoices.reduce((sum, inv) => {
    const paid = (inv.payments || [])
      .filter((p) => p.status === 'COMPLETED')
      .reduce((s, p) => s + Number(p.amount), 0);
    return sum + paid;
  }, 0);
  const outstanding = totalBilled - totalPaid;

  const statusLabels: Record<string, string> = {
    UNPAID: t('unpaid'),
    PARTIALLY_PAID: t('partiallyPaid'),
    PAID: t('paid'),
    OVERDUE: t('overdue'),
    CANCELLED: t('cancelled'),
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {L('مدفوعاتي', 'My Payments')}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {L('فواتيرك ومدفوعاتك', 'Your invoices and payment history')}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={L('إجمالي الفواتير', 'Total Billed')}
          value={`${totalBilled.toFixed(0)} ${currency}`}
          icon={<Receipt size={24} />}
          color="primary"
        />
        <StatCard
          title={L('المدفوع', 'Paid')}
          value={`${totalPaid.toFixed(0)} ${currency}`}
          icon={<TrendingUp size={24} />}
          color="green"
        />
        <StatCard
          title={L('المتبقي', 'Outstanding')}
          value={`${outstanding.toFixed(0)} ${currency}`}
          icon={<AlertCircle size={24} />}
          color={outstanding > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Outstanding alert */}
      {outstanding > 0 && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">
                {L(`لديك ${outstanding.toFixed(0)} ${currency} مستحقة`, `You have ${outstanding.toFixed(0)} ${currency} outstanding`)}
              </p>
              <p className="text-sm text-amber-700">
                {L('يرجى الدفع عند زيارتك القادمة أو التواصل معنا', 'Please pay at your next visit or contact us')}
              </p>
            </div>
          </div>

          {centerPhone && (
            <a
              href={`https://wa.me/${centerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                L(
                  `مرحباً، أريد الاستفسار عن دفع فاتورتي (${outstanding.toFixed(0)} ${currency})`,
                  `Hello, I'd like to inquire about paying my invoice (${outstanding.toFixed(0)} ${currency})`,
                ),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
            >
              <MessageCircle size={16} />
              {L('تواصل معنا', 'Contact Us')}
            </a>
          )}
        </div>
      )}

      {/* Invoice list */}
      <Card>
        <CardHeader
          title={L('الفواتير', 'Invoices')}
          subtitle={`${invoices.length} ${L('فاتورة', 'invoices')}`}
        />

        {invoices.length === 0 ? (
          <EmptyState message={L('لا توجد فواتير', 'No invoices')} />
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map((invoice) => {
              const isExpanded = expandedId === invoice.id;
              const paid = (invoice.payments || [])
                .filter((p) => p.status === 'COMPLETED')
                .reduce((s, p) => s + Number(p.amount), 0);
              const remaining = Number(invoice.total) - paid;

              return (
                <div key={invoice.id} className="py-4">
                  {/* Invoice row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : invoice.id)}
                    className="flex w-full items-center justify-between text-start"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`
                          flex h-12 w-12 items-center justify-center rounded-lg
                          ${invoice.status === 'PAID'
                            ? 'bg-green-50 text-green-600'
                            : invoice.status === 'UNPAID' || invoice.status === 'OVERDUE'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-yellow-50 text-yellow-600'
                          }
                        `}
                      >
                        <FileText size={20} />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{invoice.number}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(invoice.createdAt)}
                          </span>
                          {invoice.dueDate && (
                            <span className="text-xs">
                              {L('استحقاق', 'Due')}: {formatDate(invoice.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-end">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {Number(invoice.total).toFixed(0)} {currency}
                        </p>
                        {remaining > 0 && (
                          <p className="text-xs text-red-500">
                            {L('متبقي', 'Remaining')}: {remaining.toFixed(0)} {currency}
                          </p>
                        )}
                      </div>

                      <Badge status={invoice.status}>
                        {statusLabels[invoice.status] || invoice.status}
                      </Badge>

                      {isExpanded ? (
                        <ChevronUp size={18} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={18} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                      {/* Amount breakdown */}
                      <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4">
                        <div>
                          <p className="text-xs text-gray-500">
                            {L('المبلغ', 'Amount')}
                          </p>
                          <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                            {Number(invoice.amount).toFixed(0)} {currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            {L('الضريبة', 'Tax')}
                          </p>
                          <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
                            {Number(invoice.tax).toFixed(0)} {currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                            {L('الإجمالي', 'Total')}
                          </p>
                          <p className="mt-1 font-bold text-primary-600">
                            {Number(invoice.total).toFixed(0)} {currency}
                          </p>
                        </div>
                      </div>

                      {/* Payment history */}
                      {(invoice.payments || []).length > 0 && (
                        <div>
                          <p className="mb-2 text-sm font-medium text-gray-700">
                            {L('سجل المدفوعات', 'Payment History')}
                          </p>
                          <div className="space-y-2">
                            {invoice.payments.map((payment) => (
                              <div
                                key={payment.id}
                                className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-100"
                              >
                                <div className="flex items-center gap-3">
                                  <CreditCard size={16} className="text-gray-400" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {payment.method.replace('_', ' ')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(payment.paymentDate)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-green-600">
                                    +{Number(payment.amount).toFixed(0)} {currency}
                                  </span>
                                  <Badge status={payment.status === 'COMPLETED' ? 'PAID' : 'PENDING'}>
                                    {payment.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-3">
                        <InvoicePdfButton invoice={invoice} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}