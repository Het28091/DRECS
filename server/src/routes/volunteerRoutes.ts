import { Router } from 'express';
import {
  getAllVolunteers,
  getVolunteerById,
} from '../controllers/volunteerController';
import { authenticate } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

// List active responders (assignment/request-based, not role-based)
router.get('/', authenticate, roleGuard('authority', 'admin'), getAllVolunteers);
router.get('/:id', authenticate, roleGuard('authority', 'admin'), getVolunteerById);

export default router;
