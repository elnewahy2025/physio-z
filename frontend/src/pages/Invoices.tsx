import { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, CreditCard, DollarSign, AlertCircle, X, Printer, Calendar, User, Activity } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import api from '../lib/api';
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { ar } from '../ar';
import { Card, Badge, EmptyState, Spinner } from '../components/ui';
import type { Invoice, Settings } from '../types';

export default function Invoices() {
  const { t, lang } = useI18n();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [paymentFor, setPaymentFor] = useState<Invoice | null>(null);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);
  const isRTL = lang === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', statusFilter, page],
    queryFn: async () => {
      const params: Record<string, string> = { limit: '100', page: String(page) };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/invoices', { params });
      return res.data;
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data as Settings;
    },
  });

  const invoices: Invoice[] = data?.data || [];
  const currency = settings?.currency || 'EGP';
  const sessionPrice = settings?.sessionPrice || 300;
  const canCreate = user?.role === 'OWNER' || user?.role === 'SECRETARY';
  const canPay = user?.role === 'OWNER' || user?.role === 'SECRETARY';

  // Calculate Stats
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let outstanding = 0;
    let overdue = 0;

    invoices.forEach(inv => {
      const paid = (inv.payments || [])
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const remaining = Number(inv.total) - paid;

      totalRevenue += paid;
      
      // In professional accounting with a "Due on Receipt" policy:
      // - Outstanding: Total of ALL unpaid balances (created anytime).
      // - Overdue: Unpaid balances from previous days (created before today).
      if (inv.status !== 'CANCELLED' && remaining > 0) {
        outstanding += remaining;
        
        const createdDate = new Date(inv.createdAt);
        const today = new Date();
        
        // If the invoice was not created today, it is considered overdue
        if (createdDate.toDateString() !== today.toDateString()) {
          overdue += remaining;
        }
      }
    });

    return { totalRevenue, outstanding, overdue };
  }, [invoices]);

  const statusLabels: Record<string, string> = {
    UNPAID: t('unpaid'), PARTIALLY_PAID: t('partiallyPaid'), PAID: t('paid'),
    OVERDUE: t('overdue'), CANCELLED: t('cancelled'),
  };

  // Setup react-to-print
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: viewInvoice ? `Invoice_${viewInvoice.number}` : 'Invoice',
    pageStyle: `
      @page { size: auto; margin: 15mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `
  });

  if (isLoading) return <Spinner className="py-24" />;

  return (
    <div>
      <div className="space-y-6 print:hidden">
      {/* Header and Stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoices')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {L('إدارة الفواتير والمدفوعات', 'Manage invoices and payments')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCreate && (
              <button onClick={() => setShowInvoiceForm(true)} className="btn-primary">
                <Plus size={16} />
                <span className="hidden sm:inline">{L('إصدار فاتورة', 'Create Invoice')}</span>
                <span className="sm:hidden">{L('إصدار', 'Create')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title={L('إجمالي الإيرادات المحصلة', 'Total Revenue Collected')} 
            amount={stats.totalRevenue} 
            currency={currency}
            color="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            icon={<DollarSign className="w-6 h-6 opacity-50" />}
          />
          <StatCard 
            title={L('المبالغ المستحقة', 'Outstanding Amount')} 
            amount={stats.outstanding} 
            currency={currency}
            color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            icon={<Activity className="w-6 h-6 opacity-50" />}
          />
          <StatCard 
            title={L('المبالغ المتأخرة', 'Overdue Amount')} 
            amount={stats.overdue} 
            currency={currency}
            color="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            icon={<AlertCircle className="w-6 h-6 opacity-50" />}
          />
        </div>
      </div>

      <Card>
        {/* Filters */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex flex-wrap gap-4 items-center bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">{L('حالة الفاتورة:', 'Status:')}</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input !py-1.5 !text-sm !w-auto"
            >
              <option value="">{L(ar.allStatuses, 'All statuses')}</option>
              <option value="UNPAID">{t('unpaid')}</option>
              <option value="PARTIALLY_PAID">{t('partiallyPaid')}</option>
              <option value="PAID">{t('paid')}</option>
              <option value="OVERDUE">{t('overdue')}</option>
            </select>
          </div>
        </div>

        <div className="p-6">
          {invoices.length === 0 ? (
            <EmptyState message={t('noData')} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {invoices.map((inv) => {
                const totalPaid = (inv.payments || [])
                  .filter((p) => p.status === 'COMPLETED')
                  .reduce((sum, p) => sum + Number(p.amount), 0);
                const remaining = Number(inv.total) - totalPaid;

                return (
                  <div 
                    key={inv.id} 
                    onClick={() => setViewInvoice(inv)}
                    className="border border-gray-100 dark:border-gray-700/60 rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-gray-800 group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {inv.number}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <Calendar size={12} />
                            {new Date(inv.createdAt).toLocaleDateString(
                              lang === 'ar' ? 'ar-EG' : 'en-US',
                              { year: 'numeric', month: 'short', day: 'numeric' }
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge status={inv.status}>{statusLabels[inv.status] || inv.status}</Badge>
                    </div>

                    <div className="pt-4 flex justify-between items-end">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mb-2">
                          <User size={14} className="text-gray-400" />
                          {inv.patient.name}
                        </p>
                        {remaining > 0 && inv.status !== 'CANCELLED' ? (
                          <p className="text-xs font-bold text-red-500">
                            {L('المتبقي:', 'Remaining:')} {remaining.toFixed(0)} {currency}
                          </p>
                        ) : (
                          <p className="text-xs font-bold text-green-500">
                            {L('مدفوعة بالكامل', 'Fully Paid')}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-end">
                        <p className="text-xs text-gray-400 mb-1">{L('الإجمالي', 'Total')}</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {Number(inv.total).toFixed(0)} <span className="text-sm font-normal text-gray-500">{currency}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Hover Action Layer */}
                    {canPay && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && remaining > 0 && (
                      <div className="absolute inset-0 bg-white/60 dark:bg-gray-800/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setPaymentFor(inv); }} 
                          className="btn-primary shadow-lg"
                        >
                          <CreditCard size={18} />
                          {L(ar.pay, 'Record Payment')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Forms & Modals */}
      {showInvoiceForm && (
        <ModalOverlay onClose={() => setShowInvoiceForm(false)}>
          <NewInvoiceForm onClose={() => setShowInvoiceForm(false)} currency={currency} sessionPrice={sessionPrice} />
        </ModalOverlay>
      )}

      {paymentFor && (
        <ModalOverlay onClose={() => setPaymentFor(null)}>
          <PaymentForm invoice={paymentFor} currency={currency} onClose={() => setPaymentFor(null)} />
        </ModalOverlay>
      )}

      {viewInvoice && settings && (
        <ModalOverlay onClose={() => setViewInvoice(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:overflow-visible print:shadow-none print:rounded-none">
            {/* Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 print:hidden">
              <div className="flex items-center gap-3">
                <Badge status={viewInvoice.status}>{statusLabels[viewInvoice.status] || viewInvoice.status}</Badge>
                <span className="text-sm font-medium text-gray-500">{viewInvoice.number}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="btn-primary !py-1.5 !px-3 text-sm">
                  <Printer size={16} />
                  {L('طباعة الفاتورة', 'Print Invoice')}
                </button>
                <button onClick={() => setViewInvoice(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Invoice Preview */}
            <div className="p-8 overflow-y-auto bg-gray-100 dark:bg-gray-900 h-full">
              <div 
                ref={printRef}
                className="bg-white text-gray-900 mx-auto rounded-lg shadow-sm p-10 max-w-3xl" 
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                 <PrintableInvoiceTemplate invoice={viewInvoice} settings={settings} currency={currency} />
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
      </div>
    </div>
  );
}

// Subcomponents

function StatCard({ title, amount, currency, color, icon }: { title: string; amount: number; currency: string; color: string; icon: React.ReactNode }) {
  return (
    <div className={`rounded-2xl p-5 flex items-center justify-between ${color}`}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1">{title}</p>
        <span className="text-2xl font-bold">{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm font-medium opacity-80">{currency}</span></span>
      </div>
      {icon}
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm print:static print:p-0 print:bg-transparent print:backdrop-blur-none print:z-auto">
      {/* Click outside to close could be added here */}
      {children}
    </div>
  );
}


// Printable Template (Used for both Preview and Print)
function PrintableInvoiceTemplate({ invoice, settings, currency }: { invoice: Invoice, settings: Settings & { website?: string | null }, currency: string }) {
  const { lang } = useI18n();
  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  // Calculate the actual tax percentage applied to this specific invoice
  const actualTaxPercentage = Number(invoice.amount) > 0 && Number(invoice.tax) > 0 
    ? Math.round((Number(invoice.tax) / Number(invoice.amount)) * 100) 
    : 0;

  const totalPaid = (invoice.payments || [])
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(invoice.total) - totalPaid;
  // Calculate the actual tax rate applied to this specific invoice
  const amount = Number(invoice.amount);
  const tax = Number(invoice.tax);
  const appliedTaxRate = amount > 0 ? Math.round((tax / amount) * 100) : 0;

  return (
    <div className="bg-white text-black print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-200 pb-8 mb-8">
        <div className="flex gap-4 items-center">
          {settings.centerLogo && (
            <img 
              src={settings.centerLogo} 
              alt={settings.centerName} 
              className="w-20 h-20 object-contain rounded-lg border border-gray-100 p-1" 
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-indigo-700 mb-2">
              {settings.centerName || L('مركز العلاج الطبيعي', 'Physiotherapy Center')}
            </h1>
            <div className="text-sm text-gray-500 space-y-1">
              {settings.address && <p>{settings.address}</p>}
              {settings.phone && <p>{settings.phone}</p>}
              {settings.email && <p>{settings.email}</p>}
              {settings.website && <p>{settings.website}</p>}
            </div>
          </div>
        </div>
        <div className="text-end">
          <h2 className="text-4xl font-bold text-gray-200 uppercase tracking-widest mb-2">
            {L('فاتورة', 'Invoice')}
          </h2>
          <p className="font-semibold text-lg">{invoice.number}</p>
          <p className="text-sm text-gray-500">
            {L('التاريخ:', 'Date:')} {new Date(invoice.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
          </p>
          {invoice.dueDate && (
             <p className="text-sm text-gray-500">
               {L('تاريخ الاستحقاق:', 'Due Date:')} {new Date(invoice.dueDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
             </p>
          )}
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-10">
        <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">{L('فاتورة إلى:', 'Bill To:')}</h3>
        <p className="text-lg font-bold">{invoice.patient.name}</p>
        <p className="text-gray-600">{invoice.patient.phone}</p>
      </div>

      {/* Line Items */}
      <table className="w-full text-start border-collapse mb-8 border border-gray-200">
        <thead className="bg-gray-50">
          <tr className="border-b border-gray-200">
            <th className="py-3 px-4 font-bold text-gray-800 text-center border-e border-gray-200">{L('الوصف', 'Description')}</th>
            <th className="py-3 px-4 font-bold text-gray-800 text-center border-e border-gray-200">{L('الكمية', 'Qty')}</th>
            <th className="py-3 px-4 font-bold text-gray-800 text-center">{L('المبلغ', 'Amount')}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-4 px-4 border-e border-gray-200">
              <p className="font-medium text-center">{L('جلسة علاج طبيعي', 'Physiotherapy Session / Services')}</p>
              {invoice.appointmentId && <p className="text-xs text-gray-500 mt-1 text-center">{L('مرتبطة بموعد', 'Linked to appointment')}</p>}
            </td>
            <td className="py-4 px-4 text-center border-e border-gray-200">1</td>
            <td className="py-4 px-4 text-center" dir="ltr">
              <span className="inline-block text-center w-full">{Number(invoice.amount).toFixed(2)} {currency}</span>
            </td>
          </tr>
        </tbody>
        <tfoot className="bg-gray-50/50">
          <tr className="border-b border-gray-200">
            <td colSpan={2} className="py-2 px-4 text-end font-medium border-e border-gray-200">{L('المبلغ الفرعي:', 'Subtotal:')}</td>
            <td className="py-2 px-4 text-center font-medium" dir="ltr">{Number(invoice.amount).toFixed(2)} {currency}</td>
          </tr>
          <tr className="border-b border-gray-200">
            <td colSpan={2} className="py-2 px-4 text-end font-medium border-e border-gray-200">{L('الضريبة:', 'Tax:')} {actualTaxPercentage > 0 ? `(${actualTaxPercentage}%)` : ''}</td>
            <td className="py-2 px-4 text-center font-medium" dir="ltr">{Number(invoice.tax).toFixed(2)} {currency}</td>
          </tr>
          <tr className="bg-gray-100/50 border-b border-gray-200">
            <td colSpan={2} className="py-3 px-4 text-end font-bold text-lg border-e border-gray-200">{L('الإجمالي:', 'Total:')}</td>
            <td className="py-3 px-4 text-center font-bold text-lg" dir="ltr">{Number(invoice.total).toFixed(2)} {currency}</td>
          </tr>
          <tr className="border-b border-gray-200 text-green-600">
            <td colSpan={2} className="py-2 px-4 text-end font-medium border-e border-gray-200">{L('المدفوع:', 'Paid:')}</td>
            <td className="py-2 px-4 text-center font-medium" dir="ltr">-{totalPaid.toFixed(2)} {currency}</td>
          </tr>
          <tr className={`border-t-2 ${remaining > 0 ? 'border-red-200 text-red-600 bg-red-50/30' : 'border-gray-300 text-gray-800 bg-gray-50'}`}>
            <td colSpan={2} className="py-3 px-4 text-end font-bold text-xl border-e border-gray-200">{L('المستحق:', 'Amount Due:')}</td>
            <td className="py-3 px-4 text-center font-bold text-xl" dir="ltr">{remaining.toFixed(2)} {currency}</td>
          </tr>
        </tfoot>
      </table>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="mb-10">
          <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">{L('سجل المدفوعات', 'Payment History')}</h3>
          <table className="w-full text-sm text-start border-collapse border border-gray-200">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="py-2 px-3 font-medium text-gray-600 text-center border-e border-gray-200">{L('التاريخ', 'Date')}</th>
                <th className="py-2 px-3 font-medium text-gray-600 text-center border-e border-gray-200">{L('الطريقة', 'Method')}</th>
                <th className="py-2 px-3 font-medium text-gray-600 text-center">{L('المبلغ', 'Amount')}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map(p => (
                <tr key={p.id} className="border-b border-gray-200">
                  <td className="py-2 px-3 text-gray-800 text-center border-e border-gray-200">
                    {new Date(p.paymentDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                  </td>
                  <td className="py-2 px-3 text-gray-800 text-center border-e border-gray-200">{p.method}</td>
                  <td className="py-2 px-3 text-gray-800 text-center font-medium" dir="ltr">
                    <span className="inline-block text-center w-full">{Number(p.amount).toFixed(2)} {currency}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-400 flex flex-col items-center">
        <p>{L('شكراً لاختياركم', 'Thank you for your business.')}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="font-semibold text-gray-600">{settings.centerName}</span>
          {settings.website && (
            <>
              <span className="text-gray-300">•</span>
              <a href={settings.website} className="text-indigo-500 hover:underline">{settings.website}</a>
            </>
          )}
        </div>
      </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {L('إصدار فاتورة جديدة', 'Create New Invoice')}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={24} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}
        <div className="space-y-4">
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
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button type="submit" disabled={createInvoice.isPending} className="btn-primary">
            {createInvoice.isPending ? t('loading') : L('إصدار الفاتورة', 'Create Invoice')}
          </button>
        </div>
      </form>
    </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/20">
        <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-400 flex items-center gap-2">
          <CreditCard size={20} />
          {L(ar.recordPayment, 'Record Payment')}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{L('رقم الفاتورة', 'Invoice')}: {invoice.number}</p>
            <p className="font-bold text-gray-900 dark:text-white mt-1">{invoice.patient.name}</p>
          </div>
          <div className="text-end">
            <p className="text-sm text-red-500 font-medium">{L(ar.remaining, 'Remaining')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{remaining.toFixed(0)} <span className="text-sm">{currency}</span></p>
          </div>
        </div>

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
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button type="submit" disabled={recordPayment.isPending} className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600">
            <DollarSign size={16} />
            {recordPayment.isPending ? t('loading') : L(ar.confirmPayment, 'Confirm Payment')}
          </button>
        </div>
      </form>
    </div>
  );
}