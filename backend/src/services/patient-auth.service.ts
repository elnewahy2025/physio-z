import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { signAccessToken } from '../lib/tokens.js';
import { env } from '../config/env.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getClinicPhone() {
  const settings = await prisma.settings.findFirst();
  return settings?.phone || '+201000000000';
}

async function getClinicEmail() {
  const settings = await prisma.settings.findFirst();
  return settings?.email || '';
}

async function sendEmail(to: string, subject: string, html: string) {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.log(`\n======================================`);
    console.log(`📧 EMAIL (SMTP not configured — logging only)`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log(`======================================\n`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: env.SMTP_PORT || 587,
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: env.SMTP_FROM || user,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to ${to}`);
  } catch (err: any) {
    console.error(`📧 Email failed to ${to}: ${err.message}`);
    // Don't throw — the OTP is still saved, user can retry
  }
}

export async function requestPhoneOtp(phone: string) {
  // Check if there is an existing pending request to avoid spam
  const existing = await prisma.otpRequest.findFirst({
    where: { phone, status: 'PENDING' }
  });

  if (existing) {
    return { message: 'OTP request is already pending approval from clinic.', requestId: existing.id };
  }

  const req = await prisma.otpRequest.create({
    data: { phone, status: 'PENDING' }
  });

  return { message: 'OTP requested. Please wait for clinic approval.', requestId: req.id };
}

export async function requestEmailOtp(email: string) {
  const code = generateOTP();
  
  const patient = await prisma.patient.findFirst({ where: { email } });

  await prisma.patientOTP.create({
    data: {
      identifier: email,
      type: 'EMAIL',
      code,
      patientId: patient?.id || null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    }
  });

  const settings = await prisma.settings.findFirst();
  const centerName = settings?.centerName || 'Physio Center';

  await sendEmail(
    email,
    `${centerName} — Your Login Code`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
      <h2 style="color: #1a1a2e; margin-bottom: 8px;">${centerName}</h2>
      <p style="color: #555; font-size: 15px;">Your one-time login code is:</p>
      <div style="background: #1a1a2e; color: #fff; font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; border-radius: 8px; margin: 16px 0;">
        ${code}
      </div>
      <p style="color: #888; font-size: 13px;">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
    </div>
    `
  );

  return { message: 'OTP sent to your email.' };
}

export async function approvePhoneOtp(requestId: string) {
  const request = await prisma.otpRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new HttpError(404, 'OTP request not found');
  if (request.status !== 'PENDING') throw new HttpError(400, 'OTP request already processed');

  const code = generateOTP();
  const phone = request.phone;
  const patient = await prisma.patient.findFirst({ where: { phone } });

  const otpRecord = await prisma.patientOTP.create({
    data: {
      identifier: phone,
      type: 'PHONE',
      code,
      patientId: patient?.id || null,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins for manual WhatsApp
    }
  });

  await prisma.otpRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      otpId: otpRecord.id
    }
  });

  const clinicPhone = await getClinicPhone();
  
  // Prepare wa.me link for the secretary to click and send
  const text = encodeURIComponent(`Your Physio-Z login code is: ${code}`);
  const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`;

  return {
    message: 'OTP generated and approved.',
    waLink,
    code
  };
}

export async function rejectPhoneOtp(requestId: string) {
  const request = await prisma.otpRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new HttpError(404, 'OTP request not found');

  await prisma.otpRequest.update({
    where: { id: requestId },
    data: { status: 'REJECTED' }
  });

  return { message: 'OTP request rejected.' };
}

export async function verifyOtp(identifier: string, code: string) {
  // Find valid OTP
  const otp = await prisma.patientOTP.findFirst({
    where: {
      identifier,
      code,
      isUsed: false,
      expiresAt: { gt: new Date() }
    }
  });

  if (!otp) throw new HttpError(401, 'Invalid or expired OTP code');

  // Mark used
  await prisma.patientOTP.update({
    where: { id: otp.id },
    data: { isUsed: true }
  });

  // Does the patient exist?
  if (otp.patientId) {
    const patient = await prisma.patient.findUnique({ where: { id: otp.patientId } });
    if (!patient) throw new HttpError(404, 'Patient record missing');

    const token = signAccessToken(patient.id, 'PATIENT_PORTAL');
    return {
      type: 'LOGIN',
      token,
      patient
    };
  } else {
    // New patient, needs registration. Return a registration token
    // We can use a short-lived signed JWT for the registration phase
    const regToken = signAccessToken(`reg:${identifier}`, 'PATIENT_REGISTRATION');
    return {
      type: 'REGISTER',
      registrationToken: regToken,
      identifier
    };
  }
}

export async function registerNewPatient(
  identifier: string,
  name: string,
  gender: string | undefined,
  dateOfBirth: string | undefined
) {
  const isEmail = identifier.includes('@');
  
  const patient = await prisma.patient.create({
    data: {
      name,
      phone: !isEmail ? identifier : '',
      email: isEmail ? identifier : null,
      gender: gender || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    }
  });

  const token = signAccessToken(patient.id, 'PATIENT_PORTAL');
  return {
    token,
    patient
  };
}
