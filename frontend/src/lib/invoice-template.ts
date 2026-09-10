// frontend/src/lib/invoice-template.ts
// Generates professional HTML invoice templates in Arabic (RTL) and English (LTR).
// All data comes from the Settings table — no hardcoded values.

interface InvoiceLineItem {
  description: string;
  duration: string;
  amount: number;
}

interface PaymentRecord {
  date: string;
  method: string;
  amount: number;
  status: string;
}

interface TemplateData {
  // Center info (from Settings)
  centerName: string;
  centerLogo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  googleMapsLink: string | null;

  // Invoice info
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  status: string;
  currency: string;

  // Patient info
  patientName: string;
  patientPhone: string;
  patientEmail: string | null;

  // Line items
  items: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;

  // Payment info
  payments: PaymentRecord[];
  totalPaid: number;
  remaining: number;
}

// ─── Color palette ───
const COLORS = {
  primary: '#2563eb',
  primaryLight: '#eff6ff',
  primaryDark: '#1e40af',
  success: '#16a34a',
  successLight: '#f0fdf4',
  danger: '#dc2626',
  dangerLight: '#fef2f2',
  warning: '#d97706',
  warningLight: '#fffbeb',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray300: '#d1d5db',
  gray100: '#f3f4f6',
  gray50: '#f9fafb',
  white: '#ffffff',
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string; labelAr: string }> = {
  PAID: { bg: COLORS.success, color: COLORS.white, label: 'PAID', labelAr: 'مدفوعة' },
  UNPAID: { bg: COLORS.danger, color: COLORS.white, label: 'UNPAID', labelAr: 'غير مدفوعة' },
  PARTIALLY_PAID: { bg: COLORS.warning, color: COLORS.white, label: 'PARTIALLY PAID', labelAr: 'مدفوعة جزئياً' },
  OVERDUE: { bg: '#991b1b', color: COLORS.white, label: 'OVERDUE', labelAr: 'متأخرة' },
  CANCELLED: { bg: COLORS.gray500, color: COLORS.white, label: 'CANCELLED', labelAr: 'ملغاة' },
};

function getStatusStyle(status: string, lang: 'ar' | 'en') {
  const s = STATUS_STYLES[status] || STATUS_STYLES['UNPAID'];
  return { ...s, display: lang === 'ar' ? s.labelAr : s.label };
}

function formatMoney(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

function formatDate(dateStr: string, lang: 'ar' | 'en'): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Font setup ───
const FONT_LINK = `<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;

function getFontFamily(lang: 'ar' | 'en'): string {
  return lang === 'ar' ? "'Cairo', 'Segoe UI', Tahoma, sans-serif" : "'Inter', 'Segoe UI', Arial, sans-serif";
}

// ─── Shared components ───

function renderLogo(data: TemplateData, lang: 'ar' | 'en'): string {
  const logoSize = '64px';
  if (data.centerLogo) {
    return `
      <div style="width:${logoSize};height:${logoSize};border-radius:12px;overflow:hidden;background:${COLORS.white};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <img src="${data.centerLogo}" alt="logo" style="width:100%;height:100%;object-fit:cover;" />
      </div>
    `;
  }
  return `
    <div style="width:${logoSize};height:${logoSize};border-radius:12px;background:${COLORS.white};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <div style="font-size:32px;font-weight:800;color:${COLORS.primary};">${data.centerName?.charAt(0) || 'P'}</div>
    </div>
  `;
}

function renderContactInfo(data: TemplateData, lang: 'ar' | 'en'): string {
  const isRtl = lang === 'ar';
  const items: string[] = [];

  if (data.address) items.push(data.address);
  if (data.phone) items.push(`${isRtl ? 'هاتف' : 'Tel'}: ${data.phone}`);
  if (data.email) items.push(data.email);

  return items.length > 0
    ? `<div style="color:${COLORS.gray300};font-size:11px;line-height:1.6;text-align:center;">${items.join('  •  ')}</div>`
    : '';
}

function renderSocialLinks(data: TemplateData): string {
  const links: string[] = [];
  if (data.phone) {
    links.push(`
      <span style="display:inline-flex;align-items:center;gap:4px;margin:0 8px;">
        <span style="display:inline-flex;width:16px;height:16px;background:#25D366;border-radius:50%;align-items:center;justify-content:center;font-size:10px;">💬</span>
        <span style="color:${COLORS.gray300};font-size:10px;">WhatsApp</span>
      </span>
    `);
  }
  if (data.googleMapsLink) {
    links.push(`
      <span style="display:inline-flex;align-items:center;gap:4px;margin:0 8px;">
        <span style="display:inline-flex;width:16px;height:16px;background:#4285F4;border-radius:50%;align-items:center;justify-content:center;font-size:10px;">📍</span>
        <span style="color:${COLORS.gray300};font-size:10px;">Google Maps</span>
      </span>
    `);
  }
  return links.length > 0 ? `<div style="margin-top:8px;text-align:center;">${links.join('')}</div>` : '';
}

function renderStatusBadge(status: string, lang: 'ar' | 'en'): string {
  const style = getStatusStyle(status, lang);
  return `
    <div style="display:inline-flex;align-items:center;padding:6px 16px;border-radius:20px;background:${style.bg};color:${style.color};font-size:11px;font-weight:700;letter-spacing:0.5px;">
      ${style.display}
    </div>
  `;
}

function renderInfoCard(title: string, titleAr: string, rows: Array<{label: string; value: string}>, lang: 'ar' | 'en'): string {
  const isRtl = lang === 'ar';
  const t = isRtl ? titleAr : title;
  return `
    <div style="flex:1;background:${COLORS.white};border-radius:10px;padding:16px;border:1px solid ${COLORS.gray100};min-width:0;">
      <div style="font-size:10px;font-weight:700;color:${COLORS.gray500};text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">
        ${t}
      </div>
      ${rows.map(row => `
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
          <span style="font-size:11px;color:${COLORS.gray500};${isRtl ? 'margin-left:12px;' : 'margin-right:12px;'}">${row.label}</span>
          <span style="font-size:12px;font-weight:600;color:${COLORS.gray900};">${row.value}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLineItemsTable(data: TemplateData, lang: 'ar' | 'en'): string {
  const isRtl = lang === 'ar';
  const headers = isRtl
    ? ['المبلغ', 'المدة', 'الوصف', '#']
    : ['Amount', 'Duration', 'Description', '#'];

  const totalLabel = isRtl ? 'الإجمالي' : 'TOTAL';
  const subtotalLabel = isRtl ? 'المجموع الفرعي' : 'Subtotal';
  const taxLabel = isRtl ? `الضريبة (${data.taxRate}%)` : `Tax (${data.taxRate}%)`;

  return `
    <div style="margin-top:20px;">
      <div style="font-size:14px;font-weight:700;color:${COLORS.gray900};margin-bottom:10px;">
        ${isRtl ? 'تفاصيل الخدمة' : 'Service Details'}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:${COLORS.primary};color:${COLORS.white};">
            ${headers.map(h => `<th style="padding:10px 14px;text-align:${h === '#' ? 'center' : (isRtl ? 'right' : 'left')};font-weight:600;font-size:11px;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.items.map((item, i) => `
            <tr style="background:${i % 2 === 0 ? COLORS.white : COLORS.gray50};border-bottom:1px solid ${COLORS.gray100};">
              <td style="padding:10px 14px;text-align:center;color:${COLORS.gray700};font-weight:600;">${i + 1}</td>
              <td style="padding:10px 14px;text-align:${isRtl ? 'right' : 'left'};color:${COLORS.gray700};">${item.description}</td>
              <td style="padding:10px 14px;text-align:center;color:${COLORS.gray500};">${item.duration}</td>
              <td style="padding:10px 14px;text-align:${isRtl ? 'left' : 'right'};color:${COLORS.gray900};font-weight:600;">${formatMoney(item.amount, data.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="margin-top:14px;display:flex;justify-content:flex-end;">
        <div style="width:260px;background:${COLORS.gray50};border-radius:10px;padding:14px;border:1px solid ${COLORS.gray100};">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:${COLORS.gray500};">${subtotalLabel}</span>
            <span style="font-size:12px;color:${COLORS.gray700};font-weight:500;">${formatMoney(data.subtotal, data.currency)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-size:11px;color:${COLORS.gray500};">${taxLabel}</span>
            <span style="font-size:12px;color:${COLORS.gray700};font-weight:500;">${formatMoney(data.tax, data.currency)}</span>
          </div>
          <div style="border-top:1px solid ${COLORS.gray300};margin:8px 0;padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;font-weight:700;color:${COLORS.primary};">${totalLabel}</span>
            <span style="font-size:18px;font-weight:800;color:${COLORS.primary};">${formatMoney(data.total, data.currency)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderPaymentSection(data: TemplateData, lang: 'ar' | 'en'): string {
  if (!data.payments || data.payments.length === 0) return '';

  const isRtl = lang === 'ar';
  const headers = isRtl
    ? ['الحالة', 'المبلغ', 'طريقة الدفع', 'التاريخ']
    : ['Status', 'Amount', 'Method', 'Date'];

  const paidLabel = isRtl ? 'المدفوع' : 'Paid';
  const remainingLabel = isRtl ? 'المتبقي' : 'Remaining';

  return `
    <div style="margin-top:20px;">
      <div style="font-size:14px;font-weight:700;color:${COLORS.gray900};margin-bottom:10px;">
        ${isRtl ? 'سجل المدفوعات' : 'Payment History'}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:${COLORS.gray500};color:${COLORS.white};">
            ${headers.map(h => `<th style="padding:8px 12px;text-align:${isRtl ? 'right' : 'left'};font-weight:600;font-size:10px;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.payments.map((p, i) => `
            <tr style="background:${i % 2 === 0 ? COLORS.white : COLORS.gray50};border-bottom:1px solid ${COLORS.gray100};">
              <td style="padding:8px 12px;color:${COLORS.gray700};">${p.date}</td>
              <td style="padding:8px 12px;color:${COLORS.gray700};">${p.method}</td>
              <td style="padding:8px 12px;color:${COLORS.gray900};font-weight:600;">${formatMoney(p.amount, data.currency)}</td>
              <td style="padding:8px 12px;">
                <span style="display:inline-flex;padding:2px 8px;border-radius:10px;background:${p.status === 'COMPLETED' ? COLORS.successLight : COLORS.warningLight};color:${p.status === 'COMPLETED' ? COLORS.success : COLORS.warning};font-size:10px;font-weight:600;">
                  ${p.status}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top:10px;display:flex;justify-content:flex-end;gap:12px;">
        <div style="display:flex;align-items:center;gap:8px;background:${COLORS.successLight};padding:8px 14px;border-radius:8px;">
          <span style="font-size:11px;color:${COLORS.success};font-weight:500;">${paidLabel}:</span>
          <span style="font-size:13px;color:${COLORS.success};font-weight:700;">${formatMoney(data.totalPaid, data.currency)}</span>
        </div>
        ${data.remaining > 0 ? `
        <div style="display:flex;align-items:center;gap:8px;background:${COLORS.dangerLight};padding:8px 14px;border-radius:8px;">
          <span style="font-size:11px;color:${COLORS.danger};font-weight:500;">${remainingLabel}:</span>
          <span style="font-size:13px;color:${COLORS.danger};font-weight:700;">${formatMoney(data.remaining, data.currency)}</span>
        </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ─── Main template generator ───

export function generateInvoiceHTML(data: TemplateData, lang: 'ar' | 'en'): string {
  const isRtl = lang === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';
  const fontFamily = getFontFamily(lang);

  const invoiceLabel = isRtl ? 'فاتورة' : 'INVOICE';
  const invoiceNoLabel = isRtl ? 'رقم الفاتورة' : 'Invoice #';
  const dateLabel = isRtl ? 'تاريخ الإصدار' : 'Invoice Date';
  const dueLabel = isRtl ? 'تاريخ الاستحقاق' : 'Due Date';
  const statusLabel = isRtl ? 'الحالة' : 'Status';
  const patientLabel = isRtl ? 'بيانات المريض' : 'Patient Details';
  const patientNameLabel = isRtl ? 'الاسم' : 'Name';
  const patientPhoneLabel = isRtl ? 'الهاتف' : 'Phone';
  const patientEmailLabel = isRtl ? 'البريد الإلكتروني' : 'Email';
  const thanksMessage = isRtl
    ? 'شكراً لاختياركم مركزنا. نتمنى لكم دوام الصحة والعافية.'
    : 'Thank you for choosing our center. We wish you good health and wellness.';
  const generatedLabel = isRtl ? 'تاريخ التوليد' : 'Generated';

  return `
    <!DOCTYPE html>
    <html lang="${lang}" dir="${dir}">
    <head>
      <meta charset="UTF-8">
      ${FONT_LINK}
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: ${fontFamily};
          width: 800px;
          background: ${COLORS.gray50};
          color: ${COLORS.gray900};
          -webkit-font-smoothing: antialiased;
        }
        .invoice-page {
          width: 800px;
          min-height: 1100px;
          margin: 0 auto;
          background: ${COLORS.white};
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      </style>
    </head>
    <body>
      <div class="invoice-page">

        <!-- ── HEADER ── -->
        <div style="background:linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%);padding:28px 32px;display:flex;align-items:center;justify-content:space-between;gap:20px;">
          <div style="display:flex;align-items:center;gap:16px;flex:1;">
            ${renderLogo(data, lang)}
            <div>
              <div style="color:${COLORS.white};font-size:20px;font-weight:800;line-height:1.3;">${data.centerName}</div>
              ${renderContactInfo(data, lang)}
            </div>
          </div>
          <div style="text-align:${isRtl ? 'left' : 'right'};">
            <div style="color:${COLORS.white};font-size:11px;font-weight:400;opacity:0.8;text-transform:uppercase;letter-spacing:2px;">${invoiceLabel}</div>
            <div style="color:${COLORS.white};font-size:16px;font-weight:700;margin-top:2px;">${data.invoiceNumber}</div>
          </div>
        </div>

        <!-- ── BODY ── -->
        <div style="padding:28px 32px;flex:1;">

          <!-- Invoice title + status -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
            <div style="font-size:28px;font-weight:800;color:${COLORS.gray900};">${invoiceLabel}</div>
            ${renderStatusBadge(data.status, lang)}
          </div>

          <!-- Info cards -->
          <div style="display:flex;gap:16px;margin-bottom:24px;">
            ${renderInfoCard('Invoice Details', 'تفاصيل الفاتورة', [
              { label: invoiceNoLabel, value: data.invoiceNumber },
              { label: dateLabel, value: data.invoiceDate },
              { label: dueLabel, value: data.dueDate || '—' },
              { label: statusLabel, value: getStatusStyle(data.status, lang).display },
            ], lang)}

            ${renderInfoCard('Patient Details', 'بيانات المريض', [
              { label: patientNameLabel, value: data.patientName },
              { label: patientPhoneLabel, value: data.patientPhone },
              { label: patientEmailLabel, value: data.patientEmail || '—' },
            ], lang)}
          </div>

          <!-- Line items -->
          ${renderLineItemsTable(data, lang)}

          <!-- Payments -->
          ${renderPaymentSection(data, lang)}

        </div>

        <!-- ── FOOTER ── -->
        <div style="border-top:1px solid ${COLORS.gray100};padding:20px 32px;background:${COLORS.gray50};">
          <div style="text-align:center;color:${COLORS.gray700};font-size:12px;font-weight:500;">
            ${thanksMessage}
          </div>
          ${renderSocialLinks(data)}
          <div style="text-align:center;margin-top:12px;color:${COLORS.gray500};font-size:10px;">
            ${generatedLabel}: ${new Date().toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB')}  •  ${data.invoiceNumber}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}