import React, { useState, useEffect } from 'react';
import { paymentService, type PaymentGatewayConfig } from '../services/payment.service';
import ConfirmModal from '../../../components/ConfirmModal';
import { useI18n } from '../../../i18n';
import {
  CreditCard,
  Plus,
  Settings2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const PROVIDER_PRESETS = [
  { id: 'fawry', name: 'Fawry', nameAr: 'فوري', defaultFields: [{ key: 'merchantCode', label: 'Merchant Code' }, { key: 'securityKey', label: 'Security Key' }] },
  { id: 'instapay', name: 'InstaPay', nameAr: 'انستاباي', defaultFields: [{ key: 'instapayHandle', label: 'InstaPay Handle / Phone' }, { key: 'accountName', label: 'Account Name' }] },
  { id: 'stripe', name: 'Stripe', nameAr: 'سترايب', defaultFields: [{ key: 'publishableKey', label: 'Publishable Key' }, { key: 'secretKey', label: 'Secret Key' }] },
  { id: 'paypal', name: 'PayPal', nameAr: 'باي بال', defaultFields: [{ key: 'clientId', label: 'Client ID' }, { key: 'clientSecret', label: 'Client Secret' }] },
  { id: 'custom', name: 'Custom Gateway', nameAr: 'بوابة دفع مخصصة', defaultFields: [{ key: 'apiKey', label: 'API Key' }, { key: 'endpoint', label: 'Endpoint URL' }] },
];

const PaymentManagement: React.FC = () => {
  const { lang } = useI18n();
  const isRTL = lang === 'ar';
  const L = (ar: string, en: string) => (isRTL ? ar : en);

  const [activeTab, setActiveTab] = useState<'gateways' | 'pending'>('gateways');
  const [gateways, setGateways] = useState<PaymentGatewayConfig[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGateway, setEditingGateway] = useState<PaymentGatewayConfig | null>(null);
  const [gatewayToDelete, setGatewayToDelete] = useState<string | null>(null);
  const [paymentToConfirm, setPaymentToConfirm] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('fawry');
  const [formConfig, setFormConfig] = useState<Record<string, string>>({});
  const [formIsActive, setFormIsActive] = useState(true);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [newValueInput, setNewValueInput] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [gatewaysRes, pendingRes] = await Promise.all([
        paymentService.getGateways(),
        paymentService.getPendingPayments(),
      ]);
      setGateways(gatewaysRes);
      setPendingPayments(pendingRes);
    } catch (error) {
      console.error('Failed to load payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = (preset?: typeof PROVIDER_PRESETS[0]) => {
    const provider = preset ? preset.id : 'fawry';
    setEditingGateway(null);
    setFormName(preset ? (isRTL ? preset.nameAr : preset.name) : 'Fawry');
    setFormProvider(provider);
    
    const initialConfig: Record<string, string> = {};
    const selectedPreset = PROVIDER_PRESETS.find(p => p.id === provider);
    selectedPreset?.defaultFields.forEach(f => {
      initialConfig[f.key] = '';
    });
    setFormConfig(initialConfig);
    setFormIsActive(true);
    setShowAddModal(true);
  };

  const openEditModal = (gw: PaymentGatewayConfig) => {
    setEditingGateway(gw);
    setFormName(gw.name);
    setFormProvider(gw.provider);
    setFormConfig(typeof gw.config === 'object' && gw.config ? { ...gw.config } : {});
    setFormIsActive(gw.isActive);
    setShowAddModal(true);
  };

  const handleProviderChange = (newProvider: string) => {
    setFormProvider(newProvider);
    const preset = PROVIDER_PRESETS.find(p => p.id === newProvider);
    if (!editingGateway) {
      setFormName(preset ? (isRTL ? preset.nameAr : preset.name) : newProvider);
      const initialConfig: Record<string, string> = {};
      preset?.defaultFields.forEach(f => {
        initialConfig[f.key] = '';
      });
      setFormConfig(initialConfig);
    }
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    try {
      if (editingGateway) {
        await paymentService.updateGateway(editingGateway.id, {
          name: formName,
          provider: formProvider,
          config: formConfig,
          isActive: formIsActive,
        });
        setStatusMessage({ type: 'success', text: L('تم تحديث بوابة الدفع بنجاح', 'Payment gateway updated successfully') });
      } else {
        await paymentService.createGateway({
          name: formName,
          provider: formProvider,
          config: formConfig,
          isActive: formIsActive,
        });
        setStatusMessage({ type: 'success', text: L('تمت إضافة بوابة الدفع بنجاح', 'Payment gateway added successfully') });
      }
      setShowAddModal(false);
      await loadData();
    } catch (error) {
      console.error('Failed to save gateway:', error);
      setStatusMessage({ type: 'error', text: L('حدث خطأ أثناء حفظ بوابة الدفع', 'Failed to save payment gateway') });
    }
  };

  const handleDeleteGateway = async () => {
    if (!gatewayToDelete) return;
    try {
      await paymentService.deleteGateway(gatewayToDelete);
      setStatusMessage({ type: 'success', text: L('تم حذف بوابة الدفع بنجاح', 'Payment gateway deleted successfully') });
      await loadData();
    } catch (error) {
      console.error('Failed to delete gateway:', error);
      setStatusMessage({ type: 'error', text: L('حدث خطأ أثناء حذف بوابة الدفع', 'Failed to delete payment gateway') });
    } finally {
      setGatewayToDelete(null);
    }
  };

  const handleToggleGateway = async (gw: PaymentGatewayConfig) => {
    try {
      await paymentService.updateGateway(gw.id, { isActive: !gw.isActive });
      setGateways(prev => prev.map(item => item.id === gw.id ? { ...item, isActive: !item.isActive } : item));
    } catch (error) {
      console.error('Failed to toggle gateway:', error);
    }
  };

  const executeConfirmPayment = async () => {
    if (paymentToConfirm) {
      try {
        await paymentService.confirmPayment(paymentToConfirm);
        setStatusMessage({ type: 'success', text: L('تم تأكيد الدفعة وتحديث الفاتورة بنجاح', 'Payment confirmed and invoice updated successfully') });
        await loadData();
      } catch (error) {
        console.error('Failed to confirm payment:', error);
        setStatusMessage({ type: 'error', text: L('حدث خطأ أثناء تأكيد الدفعة', 'Failed to confirm payment') });
      } finally {
        setPaymentToConfirm(null);
      }
    }
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
    }).format(amount);
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CreditCard className="text-primary-600 dark:text-primary-400" size={28} />
            {L('إدارة بوابات الدفع الإلكتروني', 'Payment Integrations Management')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {L('تهيئة بوابات الدفع المصرية والعالمية (Fawry, InstaPay, Stripe, PayPal) وتأكيد المدفوعات', 'Configure Egyptian & global payment gateways and confirm online transactions')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {L('تحديث', 'Refresh')}
          </button>
          <button
            onClick={() => openAddModal()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            {L('إضافة بوابة جديدة', 'Add Payment Gateway')}
          </button>
        </div>
      </div>

      {/* Status Message Alert */}
      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-center justify-between ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'}`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-sm opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 space-x-reverse">
          <button
            onClick={() => setActiveTab('gateways')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'gateways'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <Settings2 size={18} />
            {L('البوابات المهيئة', 'Configured Gateways')} ({gateways.length})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <CreditCard size={18} />
            {L('المدفوعات المعلقة', 'Pending Payments')} ({pendingPayments.length})
          </button>
        </nav>
      </div>

      {/* TAB 1: GATEWAYS */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          {/* Quick Presets Banner */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-3">
              {L('إضافة سريعة لمزودين شائعين', 'Quick Add Popular Providers')}
            </span>
            <div className="flex flex-wrap gap-2">
              {PROVIDER_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => openAddModal(preset)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400 flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} />
                  {isRTL ? preset.nameAr : preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Gateways Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
            </div>
          ) : gateways.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6">
              <CreditCard className="mx-auto text-gray-400 mb-3" size={40} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {L('لا توجد بوابات دفع مهيئة بعد', 'No payment gateways configured yet')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                {L('قم بإضافة بوابة فوري أو انستاباي أو سترايب لبدء استلام المدفوعات إلكترونياً.', 'Add Fawry, InstaPay, Stripe, or custom gateway credentials to start accepting online payments.')}
              </p>
              <button
                onClick={() => openAddModal()}
                className="btn-primary mt-4 inline-flex items-center gap-2"
              >
                <Plus size={16} />
                {L('إضافة أول بوابة', 'Add First Gateway')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gateways.map(gw => (
                <div
                  key={gw.id}
                  className={`rounded-xl border p-5 transition-all shadow-sm ${
                    gw.isActive
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{gw.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 uppercase font-semibold">
                          {gw.provider}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {gw.isActive ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {L('مفعلة وجاهزة لاستقبال الدفع', 'Active & Ready')}
                          </span>
                        ) : (
                          <span className="text-gray-400 flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-gray-400" />
                            {L('معطلة', 'Inactive')}
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleGateway(gw)}
                      title={gw.isActive ? L('تعطيل', 'Disable') : L('تفعيل', 'Enable')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${gw.isActive ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${gw.isActive ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}`} />
                    </button>
                  </div>

                  {/* Config Keys Summary */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 text-xs space-y-1.5">
                    {gw.config && typeof gw.config === 'object' && Object.keys(gw.config).length > 0 ? (
                      Object.entries(gw.config).slice(0, 3).map(([k, val]) => (
                        <div key={k} className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                          <span className="font-mono text-gray-400">{k}:</span>
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300">
                            {String(val).length > 15 ? `${String(val).substring(0, 12)}...` : String(val)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400 italic">{L('لا توجد مفاتيح مدخلة', 'No keys specified')}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/60">
                    <button
                      onClick={() => openEditModal(gw)}
                      className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <Settings2 size={14} />
                      {L('تعديل الإعدادات والمفاتيح', 'Edit Config')}
                    </button>
                    <button
                      onClick={() => setGatewayToDelete(gw.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      {L('حذف', 'Delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PENDING PAYMENTS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary-600" />
            </div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={36} />
              <p className="text-gray-500 dark:text-gray-400">{L('لا توجد مدفوعات معلقة حالياً', 'No pending payments at this time')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/60">
                  <tr>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {L('المريض', 'Patient')}
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {L('رقم الفاتورة', 'Invoice #')}
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {L('طريقة الدفع', 'Method')}
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {L('المبلغ', 'Amount')}
                    </th>
                    <th className="px-6 py-3.5 text-start text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {L('المرجع', 'Reference')}
                    </th>
                    <th className="px-6 py-3.5 text-end text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {L('الإجراء', 'Action')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {payment.invoice?.patient?.name || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {payment.invoice?.number || payment.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {payment.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatAmount(Number(payment.amount))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500 dark:text-gray-400">
                        {payment.referenceNumber || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                        <button
                          onClick={() => setPaymentToConfirm(payment.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          {L('تأكيد الاستلام', 'Confirm Receipt')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT GATEWAY */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3 border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Settings2 size={20} className="text-primary-600" />
                {editingGateway ? L('تعديل بوابة الدفع', 'Edit Payment Gateway') : L('إضافة بوابة دفع جديدة', 'Add New Payment Gateway')}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-4">
              <div>
                <label className="label">{L('اسم البوابة المعروض', 'Display Name')}</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Fawry Pay, InstaPay Business, Stripe"
                  className="input"
                />
              </div>

              <div>
                <label className="label">{L('نوع المزود', 'Provider Type')}</label>
                <select
                  value={formProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="input"
                >
                  {PROVIDER_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {isRTL ? `${preset.nameAr} (${preset.name})` : preset.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Config Fields */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">{L('بيانات ومفاتيح الربط (Configuration Keys)', 'Configuration Keys & Secrets')}</label>
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    {showSecrets ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showSecrets ? L('إخفاء القيم', 'Hide') : L('إظهار القيم', 'Show')}
                  </button>
                </div>

                <div className="space-y-2.5 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  {Object.entries(formConfig).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-1/3 text-xs font-mono font-medium text-gray-700 dark:text-gray-300 truncate">
                        {key}
                      </span>
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        value={val}
                        onChange={(e) => setFormConfig({ ...formConfig, [key]: e.target.value })}
                        className="input flex-1 text-xs font-mono"
                        placeholder={`Enter ${key}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...formConfig };
                          delete updated[key];
                          setFormConfig(updated);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title={L('حذف هذا الحقل', 'Remove key')}
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add Custom Key Row */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={L('اسم المفتاح الجديد', 'New Key Name')}
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      className="input w-1/3 text-xs"
                    />
                    <input
                      type="text"
                      placeholder={L('القيمة', 'Value')}
                      value={newValueInput}
                      onChange={(e) => setNewValueInput(e.target.value)}
                      className="input flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newKeyInput.trim()) {
                          setFormConfig({ ...formConfig, [newKeyInput.trim()]: newValueInput });
                          setNewKeyInput('');
                          setNewValueInput('');
                        }
                      }}
                      className="btn-secondary px-3 py-1 text-xs whitespace-nowrap"
                    >
                      {L('إضافة', 'Add')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                <label htmlFor="formIsActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L('تفعيل هذه البوابة فوراً للاستخدام', 'Enable this gateway for active payments')}
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  {L('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingGateway ? L('حفظ التعديلات', 'Save Changes') : L('إضافة البوابة', 'Add Gateway')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR DELETE GATEWAY */}
      <ConfirmModal
        isOpen={!!gatewayToDelete}
        onClose={() => setGatewayToDelete(null)}
        onConfirm={handleDeleteGateway}
        title={L('حذف بوابة الدفع', 'Delete Payment Gateway')}
        message={L('هل أنت متأكد من حذف بوابة الدفع هذه؟ لن يتمكن المرضى من استخدامها مستقبلاً.', 'Are you sure you want to delete this payment gateway? Patients will no longer be able to use it.')}
        variant="danger"
      />

      {/* CONFIRMATION MODAL FOR CONFIRM PAYMENT */}
      <ConfirmModal
        isOpen={!!paymentToConfirm}
        onClose={() => setPaymentToConfirm(null)}
        onConfirm={executeConfirmPayment}
        title={L('تأكيد استلام الدفعة', 'Confirm Payment Receipt')}
        message={L('هل أنت متأكد من تأكيد استلام هذه الدفعة وتحديث الفاتورة إلى مدفوعة؟', 'Are you sure you want to confirm receipt of this payment and update invoice status to PAID?')}
        variant="primary"
      />
    </div>
  );
};

export default PaymentManagement;
