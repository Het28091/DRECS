import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  allocateResource,
  releaseResource,
} from '../controllers/resourceController';
import { authenticate } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';

const router = Router();

router.use(authenticate);

router.get('/', getAllResources);
router.get('/:id', getResourceById);

// Operations reserved for Authority & Admin
router.post('/', roleGuard('authority', 'admin'), createResource);
router.patch('/:id', roleGuard('authority', 'admin'), updateResource);
router.delete('/:id', roleGuard('authority', 'admin'), deleteResource);
router.post('/:id/allocate', roleGuard('authority', 'admin'), allocateResource);
router.post('/:id/release', roleGuard('authority', 'admin'), releaseResource);

export default router;
