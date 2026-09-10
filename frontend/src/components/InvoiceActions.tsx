// frontend/src/components/InvoiceActions.tsx
import { Download, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { generateInvoicePDF, generateWhatsAppLink } from '../lib/pdf';
import { useI18n } from '../i18n';

interface InvoiceActionsProps {
  invoice: any;
}

export function InvoicePdfButton({ invoice }: InvoiceActionsProps) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const handleDownload = () => {
    if (!settings) return;
    generateInvoicePDF(invoice, settings);
  };

  return (
    <button
      onClick={handleDownload}
      className="btn-secondary !py-1.5 !px-3 text-xs"
      title={L('تحميل PDF', 'Download PDF')}
    >
      <Download size={14} />
      PDF
    </button>
  );
}

export function WhatsAppButton({
  phone,
  patientName,
  dateTime,
}: {
  phone: string;
  patientName: string;
  dateTime: string;
}) {
  const { lang } = useI18n();
  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  const handleClick = () => {
    if (!settings) return;
    const link = generateWhatsAppLink(
      phone,
      settings.whatsappMessageTemplate,
      patientName,
      dateTime,
      settings.centerName,
    );
    window.open(link, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="rounded-lg bg-green-500 p-2 text-white transition-colors hover:bg-green-600"
      title={L('إرسال تذكير واتساب', 'Send WhatsApp reminder')}
    >
      <MessageCircle size={16} />
    </button>
  );
}