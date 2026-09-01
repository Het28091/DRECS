import { Router } from 'express';
import {
  getMyAssignments,
  getAssignmentsByIncident,
  getMyVolunteerAccess,
  updateAssignmentStatus,
  removeAssignment,
} from '../controllers/assignmentController';
import { authenticate } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';
import { validateBody, updateAssignmentStatusSchema } from '../utils/validators';

const router = Router();

// Approved volunteers remain citizens, so assignment access is ownership-based
// (assignment.volunteerId === req.user.id), not role-based.
router.get(
  '/my',
  authenticate,
  getMyAssignments,
);

router.get(
  '/my/access',
  authenticate,
  getMyVolunteerAccess,
);

router.get(
  '/incident/:incidentId',
  authenticate,
  roleGuard('authority', 'admin'),
  getAssignmentsByIncident,
);

router.patch(
  '/:id/status',
  authenticate,
  validateBody(updateAssignmentStatusSchema),
  updateAssignmentStatus,
);

router.delete(
  '/:id',
  authenticate,
  roleGuard('authority', 'admin'),
  removeAssignment,
);

export default router;
