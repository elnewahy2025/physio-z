// frontend/src/lib/pdf.ts
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { generateInvoiceHTML, type TemplateData } from './invoice-template';

interface Invoice {
  id: string;
  number: string;
  patientId: string;
  amount: number;
  tax: number;
  total: number;
  dueDate: string | null;
  status: string;
  createdAt: string;
  patient: { id: string; name: string; phone: string; email?: string | null };
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    status: string;
    paymentDate: string;
  }>;
}

interface Settings {
  centerName: string;
  centerLogo: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  googleMapsLink: string | null;
  sessionPrice: number;
  currency: string;
  taxRate: number;
}

/**
 * Converts invoice + settings data into template format.
 */
function prepareTemplateData(
  invoice: Invoice,
  settings: Settings,
  lang: 'ar' | 'en',
): TemplateData {
  const isAr = lang === 'ar';

  const totalPaid = (invoice.payments || [])
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const remaining = Number(invoice.total) - totalPaid;

  return {
    centerName: settings.centerName || 'Physio Center',
    centerLogo: settings.centerLogo,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    googleMapsLink: settings.googleMapsLink,

    invoiceNumber: invoice.number,
    invoiceDate: new Date(invoice.createdAt).toLocaleDateString(
      isAr ? 'ar-EG' : 'en-GB',
      { day: '2-digit', month: 'long', year: 'numeric' },
    ),
    dueDate: invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString(
          isAr ? 'ar-EG' : 'en-GB',
          { day: '2-digit', month: 'long', year: 'numeric' },
        )
      : null,
    status: invoice.status,
    currency: settings.currency || 'EGP',

    patientName: invoice.patient.name,
    patientPhone: invoice.patient.phone,
    patientEmail: invoice.patient.email,

    items: [
      {
        description: isAr ? 'جلسة علاج طبيعي' : 'Physiotherapy Session',
        duration: '45 min',
        amount: Number(invoice.amount),
      },
    ],
    subtotal: Number(invoice.amount),
    taxRate: Number(settings.taxRate) || 0,
    tax: Number(invoice.tax),
    total: Number(invoice.total),

    payments: (invoice.payments || []).map((p) => ({
      date: new Date(p.paymentDate).toLocaleDateString(
        isAr ? 'ar-EG' : 'en-GB',
        { day: '2-digit', month: 'short', year: 'numeric' },
      ),
      method: p.method.replace('_', ' '),
      amount: Number(p.amount),
      status: p.status,
    })),
    totalPaid,
    remaining,
  };
}

/**
 * Renders the invoice HTML to a hidden container, captures it with html2canvas,
 * and generates a PDF with jsPDF.
 */
async function renderToPDF(html: string, fileName: string): Promise<void> {
  // Create a hidden container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: -9999px;
    width: 800px;
    z-index: -1;
    pointer-events: none;
  `;

  // Create an iframe for isolated rendering (fonts + styles work correctly)
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width:800px;height:1200px;border:none;';
  container.appendChild(iframe);
  document.body.appendChild(container);

  // Write HTML to iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(container);
    throw new Error('Failed to create render context');
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for fonts to load (critical for Arabic rendering)
  await new Promise((resolve) => {
    if (iframe.contentWindow?.document.fonts?.ready) {
      iframe.contentWindow.document.fonts.ready.then(() => resolve(void 0));
    } else {
      setTimeout(resolve, 500);
    }
  });

  // Extra wait for font rendering
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Capture the invoice element
  const invoiceElement = iframeDoc.querySelector('.invoice-page') as HTMLElement;
  if (!invoiceElement) {
    document.body.removeChild(container);
    throw new Error('Invoice element not found');
  }

  const canvas = await html2canvas(invoiceElement, {
    scale: 2, // 2x resolution for crisp text
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 800,
    windowWidth: 800,
  });

  // Clean up
  document.body.removeChild(container);

  // Create PDF
  const imgWidth = 210; // A4 width in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const pageHeight = 297; // A4 height in mm

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // If content fits on one page
  if (imgHeight <= pageHeight) {
    pdf.addImage(canvas.toDataURL('image/png', 0.95), 'PNG', 0, 0, imgWidth, imgHeight);
  } else {
    // Multi-page: slice the canvas
    const totalPages = Math.ceil(imgHeight / pageHeight);
    let remainingHeight = imgHeight;
    let position = 0;

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      const pageCanvas = document.createElement('canvas');
      const pageCanvasCtx = pageCanvas.getContext('2d');
      if (!pageCanvasCtx) break;

      const sliceHeight = Math.min(
        canvas.width * (pageHeight / imgWidth),
        remainingHeight * (canvas.width / imgWidth),
      );

      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      pageCanvasCtx.fillStyle = '#ffffff';
      pageCanvasCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCanvasCtx.drawImage(
        canvas,
        0,
        position * (canvas.width / imgWidth),
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );

      pdf.addImage(
        pageCanvas.toDataURL('image/png', 0.95),
        'PNG',
        0,
        0,
        imgWidth,
        sliceHeight * (imgWidth / canvas.width),
      );

      remainingHeight -= pageHeight;
      position += pageHeight;
    }
  }

  // Save
  pdf.save(fileName);
}

/**
 * Generates a bilingual invoice PDF (Arabic + English).
 * Creates a single PDF with both versions on separate pages.
 */
export async function generateBilingualInvoicePDF(
  invoice: Invoice,
  settings: Settings,
): Promise<void> {
  const arabicData = prepareTemplateData(invoice, settings, 'ar');
  const englishData = prepareTemplateData(invoice, settings, 'en');

  const arabicHTML = generateInvoiceHTML(arabicData, 'ar');
  const englishHTML = generateInvoiceHTML(englishData, 'en');

  // Generate English first (page 1), then Arabic (page 2)
  // Actually, let's generate Arabic first since it's the primary language
  const arabicCanvas = await renderToCanvas(arabicHTML);
  const englishCanvas = await renderToCanvas(englishHTML);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Page 1: Arabic
  addCanvasToPDF(pdf, arabicCanvas, 0);

  // Page 2: English
  pdf.addPage();
  addCanvasToPDF(pdf, englishCanvas, 1);

  pdf.save(`${invoice.number}-bilingual.pdf`);
}

/**
 * Generates a single-language invoice PDF.
 */
export async function generateInvoicePDF(
  invoice: Invoice,
  settings: Settings,
  lang: 'ar' | 'en' = 'en',
): Promise<void> {
  const data = prepareTemplateData(invoice, settings, lang);
  const html = generateInvoiceHTML(data, lang);
  const suffix = lang === 'ar' ? 'AR' : 'EN';
  await renderToPDF(html, `${invoice.number}-${suffix}.pdf`);
}

// ─── Helpers ───

async function renderToCanvas(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 0;
    left: -9999px;
    width: 800px;
    z-index: -1;
  `;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'width:800px;height:1200px;border:none;';
  container.appendChild(iframe);
  document.body.appendChild(container);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(container);
    throw new Error('Failed to create render context');
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for fonts
  await new Promise((resolve) => {
    if (iframe.contentWindow?.document.fonts?.ready) {
      iframe.contentWindow.document.fonts.ready.then(() => resolve(void 0));
    } else {
      setTimeout(resolve, 500);
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 300));

  const invoiceElement = iframeDoc.querySelector('.invoice-page') as HTMLElement;
  if (!invoiceElement) {
    document.body.removeChild(container);
    throw new Error('Invoice element not found');
  }

  const canvas = await html2canvas(invoiceElement, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: 800,
    windowWidth: 800,
  });

  document.body.removeChild(container);
  return canvas;
}

function addCanvasToPDF(pdf: jsPDF, canvas: HTMLCanvasElement, pageNum: number): void {
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  pdf.addImage(canvas.toDataURL('image/png', 0.95), 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297));
}

// ─── WhatsApp Link Generator (unchanged) ───
export function generateWhatsAppLink(
  phone: string,
  template: string | null,
  patientName: string,
  dateTime: string,
  centerName: string,
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let message =
    template ||
    'Hello {patient_name}, this is a reminder for your appointment on {date_time} at {center_name}.';
  message = message
    .replace(/\{patient_name\}/g, patientName)
    .replace(/\{date_time\}/g, new Date(dateTime).toLocaleString('en-GB'))
    .replace(/\{center_name\}/g, centerName);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}