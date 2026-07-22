import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Only state authorities can change system settings
router.get('/', authMiddleware, roleMiddleware('state_authority'), getSettings);
router.post('/', authMiddleware, roleMiddleware('state_authority'), updateSettings);

export default router;
