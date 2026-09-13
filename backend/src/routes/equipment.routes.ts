// backend/src/routes/equipment.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole, ADVANCED_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/phase3.controller.js';

const router = Router();
router.use(requireAuth);

// Equipment is an ADVANCED+ feature
router.get('/stats', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.getEquipmentStats);
router.get('/', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.listEquipment);
router.post('/', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.createEquipment);
router.put('/:id', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.updateEquipment);
router.delete('/:id', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.deleteEquipment);
router.post('/maintenance', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.logMaintenance);
router.get('/:equipmentId/maintenance', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.getMaintenanceHistory);

export default router;
