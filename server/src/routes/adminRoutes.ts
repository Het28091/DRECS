import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAdminOverview,
} from '../controllers/adminController';
import { authenticate } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

// Protect all admin routes with authentication and Admin role guard
router.use(authenticate);
router.use(roleGuard('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/overview', getAdminOverview);

export default router;
