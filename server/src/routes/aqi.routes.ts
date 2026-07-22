import { Router } from 'express';
import {
  getLiveAQI,
  getHistoricalAQI,
  getWardAttributionHandler,
  getWardList,
  getCities,
} from '../controllers/aqi.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Public read-only endpoints (AQI data is public info)
router.get('/live',    getLiveAQI);
router.get('/history', getHistoricalAQI);
router.get('/wards',   getWardList);
router.get('/cities',  getCities);

// Attribution requires auth (calls Groq, rate-limited)
router.post('/attribution/:wardId', authMiddleware, getWardAttributionHandler);

export default router;
