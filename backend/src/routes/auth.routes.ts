// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { login, refresh, logout, register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/register', register); // NEW — public registration
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;