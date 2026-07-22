import { Router } from 'express';
import {
  getEnforcementQueue,
  getEnforcementActions,
  logViolationAction,
  getEvidencePackage,
} from '../controllers/enforcement.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { roleMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Wires endpoints to enforcement controller. Access levels: city_authority, state_authority
router.get('/queue', authMiddleware, roleMiddleware('city_authority', 'state_authority'), getEnforcementQueue);
router.get('/actions', authMiddleware, roleMiddleware('city_authority', 'state_authority'), getEnforcementActions);
router.post('/action', authMiddleware, roleMiddleware('city_authority', 'state_authority'), logViolationAction);
router.get('/evidence/:wardId', authMiddleware, roleMiddleware('city_authority', 'state_authority'), getEvidencePackage);

export default router;
