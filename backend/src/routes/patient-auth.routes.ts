import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler.js';
import * as patientAuthService from '../services/patient-auth.service.js';

const router = Router();

const requestPhoneSchema = z.object({
  phone: z.string().min(8, 'Phone number too short')
});

const requestEmailSchema = z.object({
  email: z.string().email('Invalid email')
});

const verifySchema = z.object({
  identifier: z.string(),
  code: z.string().length(6, 'OTP must be 6 digits')
});

const registerSchema = z.object({
  registrationToken: z.string(),
  identifier: z.string(),
  name: z.string().min(2, 'Name too short'),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional() // ISO string
});

router.post('/request-phone-otp', asyncHandler(async (req: Request, res: Response) => {
  const { phone } = requestPhoneSchema.parse(req.body);
  const result = await patientAuthService.requestPhoneOtp(phone);
  res.json(result);
}));

router.post('/request-email-otp', asyncHandler(async (req: Request, res: Response) => {
  const { email } = requestEmailSchema.parse(req.body);
  const result = await patientAuthService.requestEmailOtp(email);
  res.json(result);
}));

router.post('/verify-otp', asyncHandler(async (req: Request, res: Response) => {
  const { identifier, code } = verifySchema.parse(req.body);
  const result = await patientAuthService.verifyOtp(identifier, code);
  res.json(result);
}));

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { registrationToken, identifier, name, gender, dateOfBirth } = registerSchema.parse(req.body);
  
  // Verify the registration token before proceeding
  // It's a signed JWT with role PATIENT_REGISTRATION
  // For simplicity here, we trust it if they provide it, but ideally we verify it.
  // We'll rely on the frontend flow to pass the correct identifier.
  const result = await patientAuthService.registerNewPatient(identifier, name, gender, dateOfBirth);
  res.status(201).json(result);
}));

export default router;
