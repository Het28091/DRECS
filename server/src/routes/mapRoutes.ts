import { Router } from 'express';
import { getMapIncidents } from '../controllers/mapController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/incidents', authenticate, getMapIncidents);

export default router;
