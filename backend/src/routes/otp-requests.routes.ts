import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as patientAuthService from '../services/patient-auth.service.js';
import { prisma } from '../lib/prisma.js';

const router = Router();
router.use(requireAuth);
// Only staff can manage these requests
router.use(requireRole('OWNER', 'SECRETARY'));

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const requests = await prisma.otpRequest.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' }
  });
  res.json(requests);
}));

router.post('/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  const result = await patientAuthService.approvePhoneOtp(req.params.id);
  res.json(result);
}));

router.post('/:id/reject', asyncHandler(async (req: Request, res: Response) => {
  const result = await patientAuthService.rejectPhoneOtp(req.params.id);
  res.json(result);
}));

export default router;
