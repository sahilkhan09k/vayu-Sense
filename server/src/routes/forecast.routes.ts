import { Router } from 'express';
import { getLiveForecast, getForecastAccuracy } from '../controllers/forecast.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Forecast endpoints require authentication
router.get('/forecast/:wardId', authMiddleware, getLiveForecast);
router.get('/accuracy', authMiddleware, getForecastAccuracy);

export default router;
