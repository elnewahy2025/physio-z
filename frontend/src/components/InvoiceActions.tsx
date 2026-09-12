// frontend/src/components/InvoiceActions.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Languages, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { generateInvoicePDF, generateBilingualInvoicePDF, generateWhatsAppLink } from '../lib/pdf';
import { useI18n } from '../i18n';
import type { Invoice, Settings } from '../types';

export function InvoicePdfButton({ invoice }: { invoice: Invoice }) {
  const { lang } = useI18n();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const L = (ar: string, en: string) => (lang === 'ar' ? ar : en);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data as Settings;
    },
  });

  const handleDownload = async (pdfLang: 'ar' | 'en' | 'bilingual') => {
    if (!settings) return;
    setIsGenerating(pdfLang);
    setDropdownOpen(false);

    try {
      if (pdfLang === 'bilingual') {
        await generateBilingualInvoicePDF(invoice, settings);
      } else {
        await generateInvoicePDF(invoice, settings, pdfLang);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  if (isGenerating) {
    return (
      <button
        disabled
        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400"
      >
        <Loader2 size={14} className="animate-spin" />
        {isGenerating === 'bilingual'
          ? L('جاري التوليد...', 'Generating...')
          : isGenerating === 'ar'
            ? L('جاري التوليد...', 'Generating...')
            : 'Generating...'}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="btn-secondary !py-1.5 !px-3 text-xs"
        title={L('تحميل PDF', 'Download PDF')}
      >
        <Download size={14} />
        PDF
      </button>

      {dropdownOpen && (
        <div className="absolute end-0 top-full z-50 mt-1 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
          <button
            onClick={() => handleDownload('ar')}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-start text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:bg-gray-900"
          >
            <span className="text-base">🇪🇬</span>
            <span>{L('العربية', 'Arabic (RTL)')}</span>
          </button>
          <button
            onClick={() => handleDownload('en')}
            className="flex w-full items-center gap-3 border-t border-gray-100 dark:border-gray-700 px-4 py-2.5 text-start text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:bg-gray-900"
          >
            <span className="text-base">🇬🇧</span>
            <span>English (LTR)</span>
          </button>
          <button
            onClick={() => handleDownload('bilingual')}
            className="flex w-full items-center gap-3 border-t border-gray-100 dark:border-gray-700 px-4 py-2.5 text-start text-xs font-medium text-primary-700 transition-colors hover:bg-primary-50"
          >
            <Languages size={16} />
            <span>{L('ثنائية اللغة', 'Bilingual (AR + EN)')}</span>
          </button>
        </div>
      )}
    </div>
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
      return res.data as Settings;
    },
  });

  const handleClick = () => {
    if (!settings) return;
    const link = generateWhatsAppLink(
      phone,
      settings.whatsappMessageTemplate || null,
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
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </button>
  );
}