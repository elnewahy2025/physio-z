import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, CheckCircle2, AlertCircle, Loader2, PlayCircle, Calendar } from 'lucide-react';
import api from '../../lib/api';
import { useI18n } from '../../i18n';
import { Card, CardHeader, Badge } from '../ui';

export default function PayrollTab() {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<'templates' | 'run' | 'history'>('templates');
  
  // Date logic for payroll run
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [payrollMonth, setPayrollMonth] = useState(currentMonthStr);
  const [runData, setRunData] = useState<Record<string, { bonus: number, deduction: number, notes: string }>>({});

  const { data: eligibleStaff } = useQuery({
    queryKey: ['eligible-staff'],
    queryFn: async () => {
      const res = await api.get('/payroll/eligible-staff');
      return res.data;
    },
  });

  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ['payroll-templates'],
    queryFn: async () => {
      const res = await api.get('/payroll/templates');
      return res.data;
    },
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ['payroll-history'],
    queryFn: async () => {
      const res = await api.get('/payroll/history');
      return res.data;
    },
  });

  const runPayroll = useMutation({
    mutationFn: async () => {
      if (!templates) return;
      const staffRecords = templates.map((t: any) => {
        const custom = runData[t.userId] || { bonus: 0, deduction: 0, notes: '' };
        return {
          userId: t.userId,
          baseSalary: Number(t.baseSalary),
          bonus: Number(custom.bonus),
          deduction: Number(custom.deduction),
          netSalary: Number(t.baseSalary) + Number(custom.bonus) - Number(custom.deduction),
          notes: custom.notes
        };
      });
      
      const res = await api.post('/payroll/run', {
        month: payrollMonth,
        staffRecords
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-history'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setActiveSection('history');
      setRunData({});
    },
    onError: (err: any) => {
      setRunError(err.response?.data?.error || 'Error running payroll');
    }
  });

  const [runError, setRunError] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ userId: '', baseSalary: '', notes: '' });

  const saveTemplate = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      await api.post('/payroll/templates', {
        userId: data.userId,
        baseSalary: Number(data.baseSalary),
        notes: data.notes
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-templates'] });
      setShowTemplateModal(false);
      setTemplateForm({ userId: '', baseSalary: '', notes: '' });
      setSaveError(null);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.error || 'Error saving template');
    }
  });

  const [saveError, setSaveError] = useState<string | null>(null);

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      if (!window.confirm('Are you sure?')) return;
      await api.delete(`/payroll/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-templates'] });
    }
  });

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveSection('templates')}
          className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
            activeSection === 'templates'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          {L('نماذج الرواتب', 'Salary Templates')}
        </button>
        <button
          onClick={() => setActiveSection('run')}
          className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
            activeSection === 'run'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          {L('تشغيل الرواتب', 'Run Payroll')}
        </button>
        <button
          onClick={() => setActiveSection('history')}
          className={`py-3 px-6 border-b-2 font-medium text-sm transition-colors ${
            activeSection === 'history'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          {L('تاريخ الرواتب', 'Payroll History')}
        </button>
      </div>

      {/* Templates Section */}
      {activeSection === 'templates' && (
        <Card>
          <CardHeader
            title={L('نماذج الرواتب', 'Salary Templates')}
            subtitle={L('حدد الراتب الأساسي لكل موظف', 'Set the base salary for each staff member')}
            action={
              <button onClick={() => setShowTemplateModal(true)} className="btn-primary flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {L('إضافة نموذج', 'Add Template')}
              </button>
            }
          />
          
          <div className="p-4">
            {loadingTemplates ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : templates?.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {L('لا توجد نماذج رواتب بعد', 'No salary templates found')}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('الموظف', 'Staff Member')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('الدور', 'Role')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('الراتب الأساسي', 'Base Salary')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('تاريخ التحديث', 'Last Updated')}
                      </th>
                      <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('إجراءات', 'Actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {templates?.map((t: any) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {t.user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <Badge status="info">{t.user.role}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatMoney(t.baseSalary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(t.updatedAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                          <button
                            onClick={() => {
                              setTemplateForm({ userId: t.userId, baseSalary: t.baseSalary.toString(), notes: t.notes || '' });
                              setShowTemplateModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mx-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTemplate.mutate(t.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mx-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Run Payroll Section */}
      {activeSection === 'run' && (
        <Card>
          <CardHeader
            title={L('إصدار الرواتب', 'Run Payroll')}
            subtitle={L('قم بمراجعة وتأكيد رواتب هذا الشهر', 'Review and confirm this month\'s payroll')}
            action={
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="month"
                  value={payrollMonth}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPayrollMonth(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            }
          />
          
          <div className="p-4">
            {runError && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-start gap-3 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{runError}</p>
              </div>
            )}
            
            {!templates || templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {L('يرجى إضافة نماذج رواتب أولاً', 'Please add salary templates first')}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {L('الموظف', 'Staff Member')}
                        </th>
                        <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {L('أساسي', 'Base')}
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-green-600 dark:text-green-400 uppercase">
                          {L('مكافأة (+)', 'Bonus (+)')}
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-red-600 dark:text-red-400 uppercase">
                          {L('خصم (-)', 'Deduction (-)')}
                        </th>
                        <th className="px-6 py-3 text-start text-xs font-bold text-gray-900 dark:text-gray-100 uppercase">
                          {L('الصافي', 'Net Pay')}
                        </th>
                        <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {L('ملاحظات', 'Notes')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                      {templates.map((t: any) => {
                        const custom = runData[t.userId] || { bonus: 0, deduction: 0, notes: '' };
                        const net = Number(t.baseSalary) + Number(custom.bonus) - Number(custom.deduction);
                        
                        return (
                          <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {t.user.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatMoney(t.baseSalary)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <input
                                type="number"
                                min="0"
                                value={custom.bonus || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRunData({...runData, [t.userId]: {...custom, bonus: Number(e.target.value)}})}
                                className="w-24 h-8 text-sm rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <input
                                type="number"
                                min="0"
                                value={custom.deduction || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRunData({...runData, [t.userId]: {...custom, deduction: Number(e.target.value)}})}
                                className="w-24 h-8 text-sm rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                              {formatMoney(net)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                              <input
                                type="text"
                                value={custom.notes || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRunData({...runData, [t.userId]: {...custom, notes: e.target.value}})}
                                className="w-32 h-8 text-sm rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                placeholder="..."
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col items-end gap-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {L('إجمالي الرواتب لهذا الشهر:', 'Total Payroll this month:')}
                      <span className="text-xl font-bold text-gray-900 dark:text-white mx-2">
                        {formatMoney(templates.reduce((acc: number, t: any) => {
                          const custom = runData[t.userId] || { bonus: 0, deduction: 0 };
                          return acc + Number(t.baseSalary) + Number(custom.bonus) - Number(custom.deduction);
                        }, 0))}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => runPayroll.mutate()}
                      disabled={runPayroll.isPending}
                      className="btn-primary w-full sm:w-auto"
                    >
                      {runPayroll.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <PlayCircle className="h-5 w-5 me-2" />
                      )}
                      {L('تأكيد وإصدار الرواتب', 'Confirm & Run Payroll')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* History Section */}
      {activeSection === 'history' && (
        <Card>
          <CardHeader
            title={L('تاريخ الرواتب', 'Payroll History')}
          />
          
          <div className="p-4">
            {loadingHistory ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : history?.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {L('لا توجد سجلات رواتب', 'No payroll records found')}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('تاريخ', 'Date')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('الموظف', 'Staff Member')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('المبلغ المصروف', 'Amount Paid')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('البيان', 'Description')}
                      </th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {L('ملاحظات', 'Notes')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {history?.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(exp.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {exp.staff?.name || L('محذوف', 'Deleted')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatMoney(exp.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {exp.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {exp.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Add Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {templateForm.userId ? L('تعديل نموذج الراتب', 'Edit Salary Template') : L('إضافة نموذج راتب', 'Add Salary Template')}
              </h2>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={(e: React.FormEvent) => {
                e.preventDefault();
                saveTemplate.mutate(templateForm);
              }}
              className="p-6 space-y-6"
            >
              {saveError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 flex items-start gap-2 border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-sm">{saveError}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {L('الموظف', 'Staff Member')}
                </label>
                <select
                  required
                  value={templateForm.userId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTemplateForm({ ...templateForm, userId: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  disabled={!!templates?.find((t: any) => t.userId === templateForm.userId) && templateForm.userId !== ''}
                >
                  <option value="">{L('اختر الموظف...', 'Select staff...')}</option>
                  {eligibleStaff?.map((staff: any) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} - {staff.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {L('الراتب الأساسي', 'Base Salary')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                    <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                      {L('ج.م', 'EGP')}
                    </span>
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={templateForm.baseSalary}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateForm({ ...templateForm, baseSalary: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white ps-12"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {L('ملاحظات إضافية (اختياري)', 'Notes (Optional)')}
                </label>
                <input
                  type="text"
                  value={templateForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateForm({ ...templateForm, notes: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder={L('أي ملاحظات عن العقد...', 'Any notes about the contract...')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary" onClick={() => setShowTemplateModal(false)}>
                  {L('إلغاء', 'Cancel')}
                </button>
                <button type="submit" className="btn-primary" disabled={saveTemplate.isPending}>
                  {saveTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  {L('حفظ النموذج', 'Save Template')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
