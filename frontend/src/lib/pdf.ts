// frontend/src/lib/pdf.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  id: string;
  number: string;
  patientId: string;
  appointmentId: string | null;
  amount: number;
  tax: number;
  total: number;
  dueDate: string | null;
  status: string;
  paymentMethod: string | null;
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

interface SettingsData {
  centerName: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  googleMapsLink: string | null;
  sessionPrice: number;
  currency: string;
  taxRate: number;
}

const STATUS_COLORS: Record<string, { bg: [number, number, number]; text: string; label: string }> = {
  PAID: { bg: [16, 185, 129], text: 'PAID', label: 'Paid' },
  UNPAID: { bg: [239, 68, 68], text: 'UNPAID', label: 'Unpaid' },
  PARTIALLY_PAID: { bg: [245, 158, 11], text: 'PARTIALLY PAID', label: 'Partially Paid' },
  OVERDUE: { bg: [220, 38, 38], text: 'OVERDUE', label: 'Overdue' },
  CANCELLED: { bg: [107, 114, 128], text: 'CANCELLED', label: 'Cancelled' },
};

export function generateInvoicePDF(invoice: InvoiceData, settings: SettingsData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // ─── Colors ───
  const primary: [number, number, number] = [37, 99, 235]; // blue-600
  const primaryLight: [number, number, number] = [219, 234, 254]; // blue-100
  const darkGray: [number, number, number] = [31, 41, 55];
  const gray: [number, number, number] = [107, 114, 128];
  const lightGray: [number, number, number] = [243, 244, 246];
  const borderGray: [number, number, number] = [229, 231, 235];

  // ─── Header ───
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Center name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(settings.centerName || 'Physio Center', pageWidth / 2, 18, { align: 'center' });

  // Center contact info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const contactParts = [
    settings.address,
    settings.phone && `Tel: ${settings.phone}`,
    settings.email,
  ].filter(Boolean);
  doc.text(contactParts.join('  |  '), pageWidth / 2, 28, { align: 'center' });

  // Invoice title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primary);
  doc.text('INVOICE', margin, 60);

  // Invoice number (right side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text(invoice.number, pageWidth - margin, 60, { align: 'right' });

  // ─── Invoice Info Box ───
  let yPos = 70;

  // Left box: Invoice details
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, yPos, contentWidth / 2 - 5, 32, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('INVOICE DATE', margin + 5, yPos + 7);
  doc.text('DUE DATE', margin + 5, yPos + 15);
  doc.text('STATUS', margin + 5, yPos + 23);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  const createdDate = new Date(invoice.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  doc.text(createdDate, margin + 40, yPos + 7);
  doc.text(
    invoice.dueDate
      ? new Date(invoice.dueDate).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—',
    margin + 40,
    yPos + 15,
  );

  // Status badge
  const statusInfo = STATUS_COLORS[invoice.status] || STATUS_COLORS['UNPAID'];
  doc.setFillColor(...statusInfo.bg);
  doc.roundedRect(margin + 40, yPos + 19, 45, 6, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(statusInfo.text, margin + 62.5, yPos + 23.5, { align: 'center' });

  // Right box: Patient details
  const rightBoxX = margin + contentWidth / 2 + 5;
  doc.setFillColor(...primaryLight);
  doc.roundedRect(rightBoxX, yPos, contentWidth / 2 - 5, 32, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...gray);
  doc.text('BILLED TO', rightBoxX + 5, yPos + 7);

  doc.setFontSize(11);
  doc.setTextColor(...darkGray);
  doc.text(invoice.patient.name, rightBoxX + 5, yPos + 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(invoice.patient.phone, rightBoxX + 5, yPos + 21);
  if (invoice.patient.email) {
    doc.text(invoice.patient.email, rightBoxX + 5, yPos + 27);
  }

  yPos += 45;

  // ─── Line Items Table ───
  const currency = settings.currency || 'EGP';

  autoTable(doc, {
    startY: yPos,
    head: [['#', 'Description', 'Duration', 'Amount']],
    body: [
      [
        '1',
        'Physiotherapy Session',
        '45 min',
        `${Number(invoice.amount).toFixed(2)} ${currency}`,
      ],
    ],
    foot: [
      ['', '', 'Subtotal', `${Number(invoice.amount).toFixed(2)} ${currency}`],
      ['', '', 'Tax', `${Number(invoice.tax).toFixed(2)} ${currency}`],
      ['', '', 'TOTAL', `${Number(invoice.total).toFixed(2)} ${currency}`],
    ],
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: borderGray,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: darkGray,
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  // Get the Y position after the table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterTable = (doc as any).lastAutoTable.finalY + 10;

  // ─── Payments History ───
  if (invoice.payments && invoice.payments.length > 0) {
    const totalPaid = invoice.payments
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const remaining = Number(invoice.total) - totalPaid;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...darkGray);
    doc.text('PAYMENT HISTORY', margin, afterTable);

    autoTable(doc, {
      startY: afterTable + 5,
      head: [['Date', 'Method', 'Amount', 'Status']],
      body: invoice.payments.map((p) => [
        new Date(p.paymentDate).toLocaleDateString('en-GB'),
        p.method.replace('_', ' '),
        `${Number(p.amount).toFixed(2)} ${currency}`,
        p.status,
      ]),
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: gray,
        textColor: [255, 255, 255],
        fontSize: 9,
      },
      columnStyles: {
        3: { halign: 'right' },
      },
      margin: { left: margin, right: margin },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afterPayments = (doc as any).lastAutoTable.finalY + 10;

    // Summary box
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, afterPayments, contentWidth, 20, 2, 2, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Total Paid:', pageWidth - margin - 70, afterPayments + 8);
    doc.text('Remaining:', pageWidth - margin - 70, afterPayments + 15);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(`${totalPaid.toFixed(2)} ${currency}`, pageWidth - margin - 5, afterPayments + 8, {
      align: 'right',
    });

    if (remaining > 0) {
      doc.setTextColor(239, 68, 68);
      doc.text(`${remaining.toFixed(2)} ${currency}`, pageWidth - margin - 5, afterPayments + 15, {
        align: 'right',
      });
    } else {
      doc.setTextColor(16, 185, 129);
      doc.text('0.00 ' + currency, pageWidth - margin - 5, afterPayments + 15, {
        align: 'right',
      });
    }
  }

  // ─── Footer ───
  const footerY = pageHeight - 25;

  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(
    'Thank you for choosing our physiotherapy center.',
    pageWidth / 2,
    footerY + 6,
    { align: 'center' },
  );

  doc.setFontSize(7);
  doc.text(
    'This invoice was generated automatically. Please keep it for your records.',
    pageWidth / 2,
    footerY + 11,
    { align: 'center' },
  );

  // ─── Save ───
  doc.save(`${invoice.number}.pdf`);
}

// ─── WhatsApp Link Generator ───
export function generateWhatsAppLink(
  phone: string,
  template: string | null,
  patientName: string,
  dateTime: string,
  centerName: string,
): string {
  // Clean phone number (remove +, spaces, dashes)
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  // Default template if none set
  let message =
    template ||
    'Hello {patient_name}, this is a reminder for your appointment on {date_time} at {center_name}.';

  // Replace placeholders
  message = message
    .replace('{patient_name}', patientName)
    .replace('{date_time}', new Date(dateTime).toLocaleString('en-GB'))
    .replace('{center_name}', centerName);

  // Encode for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}