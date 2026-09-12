import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import * as cdsService from '../services/clinical-decision.service.js';

const router = Router();
router.use(requireAuth);

// ─── TREATMENT PROTOCOLS ───

// List all active protocols (Therapists, Secretaries, Owners)
router.get('/protocols', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res, next) => {
  try {
    const { bodyRegion, category, search } = req.query;
    const protocols = await cdsService.listProtocols({
      bodyRegion: bodyRegion as string,
      category: category as string,
      search: search as string,
    });
    res.json(protocols);
  } catch (err) {
    next(err);
  }
});

// Get protocol details
router.get('/protocols/:id', requireRole('OWNER', 'SECRETARY', 'THERAPIST'), async (req, res, next) => {
  try {
    const protocol = await cdsService.getProtocolById(req.params.id);
    res.json(protocol);
  } catch (err) {
    next(err);
  }
});

// Create protocol
router.post('/protocols', requireRole('OWNER', 'THERAPIST'), async (req, res, next) => {
  try {
    const created = await cdsService.createProtocol(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Update protocol
router.put('/protocols/:id', requireRole('OWNER', 'THERAPIST'), async (req, res, next) => {
  try {
    const updated = await cdsService.updateProtocol(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete protocol
router.delete('/protocols/:id', requireRole('OWNER'), async (req, res, next) => {
  try {
    const deleted = await cdsService.deleteProtocol(req.params.id);
    res.json(deleted);
  } catch (err) {
    next(err);
  }
});

// ─── CLINICAL DECISION ENGINE & SUGGESTIONS ───

// Suggest diagnosis, physical tests, and protocols based on pain region & symptoms
router.post('/suggest', requireRole('OWNER', 'THERAPIST'), async (req, res, next) => {
  try {
    const suggestions = await cdsService.suggestDiagnosis(req.body);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});

// Predict clinical recovery outcome & milestone trajectory
router.post('/outcome-prediction', requireRole('OWNER', 'THERAPIST'), async (req, res, next) => {
  try {
    const prediction = await cdsService.predictOutcome(req.body);
    res.json(prediction);
  } catch (err) {
    next(err);
  }
});

export default router;
