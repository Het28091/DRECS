import { Router } from 'express';
import {
  getOverviewStats,
  getIncidentTrends,
  getVolunteerActivity,
  getResourceUtilization,
} from '../controllers/analyticsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/overview', getOverviewStats);
router.get('/incidents/trends', getIncidentTrends);
router.get('/volunteers/activity', getVolunteerActivity);
router.get('/resources/utilization', getResourceUtilization);

export default router;
