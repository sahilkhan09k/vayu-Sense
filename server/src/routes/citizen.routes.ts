import { Router } from 'express';
import {
  getCitizenAdvisoryHandler,
  getCitizenWards,
  getCitizenCommuteAdvisory,
  submitPollutionReport,
  getRecentReports,
} from '../controllers/citizen.controller.js';

const router = Router();

router.get('/advisory', getCitizenAdvisoryHandler);
router.get('/wards',    getCitizenWards);
router.get('/commute',  getCitizenCommuteAdvisory);
router.post('/report',  submitPollutionReport);
router.get('/reports',  getRecentReports);

export default router;
