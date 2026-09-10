// backend/src/routes/notification.routes.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import * as controller from '../controllers/notification.controller.js';

const router = Router();
router.use(requireAuth);

router.get('/', controller.list);
router.get('/stream', controller.stream); // SSE endpoint
router.patch('/:id/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);

export default router;