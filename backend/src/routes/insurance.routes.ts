import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as insuranceService from '../services/insurance.service.js';

const router = Router();
router.use(requireAuth);

// ─── PROVIDERS ───
router.get('/providers', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const providers = await insuranceService.listProviders(activeOnly);
    res.json(providers);
  } catch (err) {
    next(err);
  }
});

router.post('/providers', requireRole('OWNER', 'SECRETARY'), async (req, res, next) => {
  try {
    const provider = await insuranceService.createProvider(req.body);
    res.status(201).json(provider);
  } catch (err) {
    next(err);
  }
});

router.put('/providers/:id', requireRole('OWNER'), async (req, res, next) => {
  try {
    const updated = await insuranceService.updateProvider(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/providers/:id', requireRole('OWNER'), async (req, res, next) => {
  try {
    const deleted = await insuranceService.deleteProvider(req.params.id);
    res.json(deleted);
  } catch (err) {
    next(err);
  }
});

// ─── PATIENT POLICIES ───
router.get('/policies/:patientId', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res, next) => {
  try {
    const policies = await insuranceService.getPatientPolicies(req.params.patientId);
    res.json(policies);
  } catch (err) {
    next(err);
  }
});

router.post('/policies/:patientId', requireRole('OWNER', 'SECRETARY'), async (req, res, next) => {
  try {
    const policy = await insuranceService.createPatientPolicy({
      ...req.body,
      patientId: req.params.patientId,
    });
    res.status(201).json(policy);
  } catch (err) {
    next(err);
  }
});

router.put('/policies/item/:id', requireRole('OWNER', 'SECRETARY'), async (req, res, next) => {
  try {
    const updated = await insuranceService.updatePatientPolicy(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── CLAIMS ───
router.get('/claims', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res, next) => {
  try {
    const { status, providerId, patientId, search } = req.query;
    const claims = await insuranceService.listClaims({
      status: status as string,
      providerId: providerId as string,
      patientId: patientId as string,
      search: search as string,
    });
    res.json(claims);
  } catch (err) {
    next(err);
  }
});

router.get('/claims/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res, next) => {
  try {
    const claim = await insuranceService.getClaimById(req.params.id);
    res.json(claim);
  } catch (err) {
    next(err);
  }
});

router.post('/claims', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res, next) => {
  try {
    const claim = await insuranceService.createClaim(req.body);
    res.status(201).json(claim);
  } catch (err) {
    next(err);
  }
});

router.put('/claims/:id/status', requireRole('OWNER', 'SECRETARY'), async (req, res, next) => {
  try {
    const updated = await insuranceService.updateClaimStatus(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── CALCULATOR & STATS ───
router.post('/calculate', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res, next) => {
  try {
    const { amount, policyId, providerId } = req.body;
    const calculation = await insuranceService.calculateCoverage({
      amount: Number(amount) || 0,
      policyId,
      providerId,
    });
    res.json(calculation);
  } catch (err) {
    next(err);
  }
});

router.get('/stats', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (_req, res, next) => {
  try {
    const stats = await insuranceService.getInsuranceStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
