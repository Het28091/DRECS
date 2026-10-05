import { Router } from 'express';
import {
  createIncident,
  reviewIncident,
  getMyIncidents,
  getAllIncidents,
  getPublicIncidents,
  getIncidentById,
  updateIncidentStatus,
} from '../controllers/incidentController';
import {
  createVolunteerRequest,
  getVolunteerRequestsByIncident,
} from '../controllers/volunteerRequestController';
import { authenticate } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';
import {
  validateBody,
  reviewVolunteerRequestSchema,
  createIncidentSchema,
  updateIncidentStatusSchema,
  createVolunteerRequestSchema,
} from '../utils/validators';

const router = Router();

router.post(
  '/',
  authenticate,
  roleGuard('citizen', 'volunteer'),
  validateBody(createIncidentSchema),
  createIncident,
);

router.get(
  '/my',
  authenticate,
  roleGuard('citizen', 'volunteer'),
  getMyIncidents,
);

// Public incidents for citizens (must be before /:id catch-all)
router.get(
  '/public',
  authenticate,
  getPublicIncidents,
);

router.post(
  '/:id/volunteer-request',
  authenticate,
  roleGuard('citizen', 'volunteer'),
  validateBody(createVolunteerRequestSchema),
  createVolunteerRequest,
);

router.get(
  '/:id/volunteer-requests',
  authenticate,
  roleGuard('authority', 'admin'),
  getVolunteerRequestsByIncident,
);

router.get(
  '/',
  authenticate,
  roleGuard('authority', 'admin'),
  getAllIncidents,
);

router.patch(
  '/:id/status',
  authenticate,
  roleGuard('authority', 'admin'),
  validateBody(updateIncidentStatusSchema),
  updateIncidentStatus,
);

router.patch('/:id/review', authenticate, roleGuard('authority', 'admin'), validateBody(reviewVolunteerRequestSchema), reviewIncident);

router.get('/:id', authenticate, getIncidentById);

export default router;
