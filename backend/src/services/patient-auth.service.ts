import { prisma } from '../lib/prisma.js';
import { HttpError } from '../lib/errors.js';
import { signAccessToken } from '../lib/tokens.js';
import crypto from 'crypto';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getClinicPhone() {
  const settings = await prisma.settings.findFirst();
  return settings?.phone || '+201000000000';
}

async function getClinicEmail() {
  const settings = await prisma.settings.findFirst();
  return settings?.email || 'noreply@physio-z.com';
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
  // Directly generate and 'send' the email OTP
  const code = generateOTP();
  
  // See if patient exists
  const patient = await prisma.patient.findFirst({ where: { email } });

  const otpRecord = await prisma.patientOTP.create({
    data: {
      identifier: email,
      type: 'EMAIL',
      code,
      patientId: patient?.id || null,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes validity
    }
  });

  const clinicEmail = await getClinicEmail();
  
  // MOCK SEND EMAIL
  console.log(`\n======================================`);
  console.log(`📧 MOCK EMAIL DISPATCH`);
  console.log(`From: ${clinicEmail}`);
  console.log(`To: ${email}`);
  console.log(`Subject: Your Physio-Z Login Code`);
  console.log(`Body: Your OTP code is ${code}. It expires in 5 minutes.`);
  console.log(`======================================\n`);

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
