import { Router } from 'express';
import {
  getAllVolunteerRequests,
  getMyVolunteerRequests,
  reviewVolunteerRequest,
} from '../controllers/volunteerRequestController';
import { authenticate } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';
import {
  validateBody,
  reviewVolunteerRequestSchema,
} from '../utils/validators';

const router = Router();

// Centralized management for authority/admin (all requests across incidents)
router.get(
  '/',
  authenticate,
  roleGuard('authority', 'admin'),
  getAllVolunteerRequests,
);

// Current user's own requests (citizen)
router.get(
  '/my',
  authenticate,
  getMyVolunteerRequests,
);

router.patch(
  '/:id/status',
  authenticate,
  roleGuard('authority', 'admin'),
  validateBody(reviewVolunteerRequestSchema),
  reviewVolunteerRequest,
);

export default router;
