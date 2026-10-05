import { Router } from 'express';
import {
  getOverviewStats,
  getIncidentTrends,
  getVolunteerActivity,
  getResourceUtilization,
} from '../controllers/analyticsController';
import { roleGuard } from '../middleware/roleGuard';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/overview', getOverviewStats);
router.get('/incidents/trends', roleGuard('authority', 'admin'), getIncidentTrends);
router.get('/volunteers/activity', roleGuard('authority', 'admin'), getVolunteerActivity);
router.get('/resources/utilization', roleGuard('authority', 'admin'), getResourceUtilization);

export default router;
