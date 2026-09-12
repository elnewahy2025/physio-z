import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, CreditCard, ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import { useI18n } from '../../i18n';
import { ar } from '../../ar';
import { Card, CardHeader, Badge, EmptyState, Spinner } from '../../components/ui';
import type { Invoice } from '../../types';
import { useNavigate } from 'react-router-dom';
import { usePatientAuth } from '../../store/patient-auth';

export default function PatientInvoices() {
  const { t, lang } = useI18n();
  const { patient } = usePatientAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!patient) navigate('/portal/login');
  }, [patient, navigate]);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: async () => {
      const res = await api.get('/portal/invoices');
      return res.data.data as Invoice[];
    },
    enabled: !!patient
  });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US');

  const statusLabels: Record<string, string> = {
    PAID: t('paid'),
    UNPAID: t('unpaid'),
    PARTIALLY_PAID: t('partiallyPaid'),
    OVERDUE: t('overdue'),
  };

  const L = (arText: string, enText: string) => (lang === 'ar' ? arText : enText);

  if (isLoading) return <Spinner className="py-24" />;

  const list = invoices || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button onClick={() => navigate('/portal/dashboard')} className="mr-4 p-2 text-gray-400 hover:text-primary-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Invoices & Payments</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Card>
          <CardHeader
            title={t('invoices')}
            subtitle={`${list.length} ${L(ar.invoiceCount, 'invoices')}`}
          />

          {list.length === 0 ? (
            <EmptyState message={t('noData')} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Date
                    </th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Amount
                    </th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {list.map((inv) => (
                    <tr key={inv.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4 text-gray-900 dark:text-gray-100 font-medium">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="py-4 text-gray-700 dark:text-gray-300 font-medium">
                        {inv.amount} EGP
                      </td>
                      <td className="py-4">
                        <Badge
                          status={
                            inv.status === 'PAID'
                              ? 'success'
                              : inv.status === 'OVERDUE'
                              ? 'error'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'warning'
                              : 'error'
                          }
                        >
                          {statusLabels[inv.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}