// backend/src/services/email.service.ts
// Sends emails via SMTP (nodemailer). If SMTP is not configured, logs instead.

import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null; // Email not configured
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

export function isEmailConfigured(): boolean {
  return getTransporter() !== null;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.log(`📧 [EMAIL SKIPPED — SMTP not configured]`);
    console.log(`   To: ${params.to}`);
    console.log(`   Subject: ${params.subject}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: env.SMTP_FROM || `Physio Center <${env.SMTP_USER}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    console.log(`📧 Email sent to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error(`📧 Email failed to ${params.to}:`, error);
    return false;
  }
}

// ─── Email Templates ───

export function weeklyReportTemplate(data: {
  centerName: string;
  weekStart: string;
  weekEnd: string;
  totalAppointments: number;
  completedAppointments: number;
  newPatients: number;
  revenueCollected: number;
  currency: string;
  outstandingAmount: number;
  topTherapist: string | null;
  therapistRating: number | null;
}): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f3f4f6; }
      .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
      .header { background: linear-gradient(135deg, #2563eb, #1e40af); padding: 24px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 22px; }
      .header p { color: #93c5fd; margin: 8px 0 0 0; font-size: 13px; }
      .content { padding: 24px; }
      .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
      .stat-card { background: #f9fafb; border-radius: 8px; padding: 16px; text-align: center; }
      .stat-value { font-size: 24px; font-weight: 700; color: #111827; }
      .stat-label { font-size: 11px; color: #6b7280; margin-top: 4px; }
      .highlight { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .footer { background: #f9fafb; padding: 16px; text-align: center; color: #6b7280; font-size: 12px; }
      .green { color: #16a34a; }
      .red { color: #dc2626; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${data.centerName}</h1>
        <p>Weekly Report — ${data.weekStart} to ${data.weekEnd}</p>
      </div>
      <div class="content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${data.totalAppointments}</div>
            <div class="stat-label">Total Appointments</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.completedAppointments}</div>
            <div class="stat-label">Completed Sessions</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.newPatients}</div>
            <div class="stat-label">New Patients</div>
          </div>
          <div class="stat-card">
            <div class="stat-value green">${data.currency} ${data.revenueCollected.toFixed(0)}</div>
            <div class="stat-label">Revenue Collected</div>
          </div>
        </div>

        ${data.outstandingAmount > 0 ? `
        <div class="highlight">
          <p style="margin: 0; color: #dc2626; font-weight: 600;">
            ⚠ Outstanding Balance: ${data.currency} ${data.outstandingAmount.toFixed(0)}
          </p>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 13px;">
            Follow up with patients who have unpaid invoices.
          </p>
        </div>
        ` : ''}

        ${data.topTherapist ? `
        <div class="highlight">
          <p style="margin: 0; font-weight: 600; color: #111827;">
            🏆 Top Performer: ${data.topTherapist}
            ${data.therapistRating ? ` (★ ${data.therapistRating})` : ''}
          </p>
        </div>
        ` : ''}

        <p style="text-align: center; color: #6b7280; font-size: 13px; margin-top: 24px;">
          This is an automated weekly summary. Login to the dashboard for full details.
        </p>
      </div>
      <div class="footer">
        ${data.centerName} — Physio Center Management System
      </div>
    </div>
  </body>
  </html>
  `;
}