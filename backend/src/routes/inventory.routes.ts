// backend/src/routes/inventory.routes.ts
import { Router } from 'express';
import { requireAuth, requireRole, ADVANCED_MANAGER_OR_OWNER } from '../middleware/auth.js';
import * as controller from '../controllers/phase3.controller.js';

const router = Router();
router.use(requireAuth);

// Inventory is an ADVANCED+ feature
router.get('/stats', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.getInventoryStats);
router.get('/', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.listInventory);
router.post('/', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.createInventory);
router.put('/:id', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.updateInventory);
router.delete('/:id', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.deleteInventory);
router.post('/transaction', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.stockTransaction);
router.get('/:itemId/history', requireRole(...ADVANCED_MANAGER_OR_OWNER), controller.getTransactionHistory);

export default router;
