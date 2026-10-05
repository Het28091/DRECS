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

import { validateBody, createResourceSchema, updateResourceSchema, allocateResourceSchema, releaseResourceSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get('/', getAllResources);
router.get('/:id', getResourceById);

// Operations reserved for Authority & Admin
router.post('/', roleGuard('authority', 'admin'), validateBody(createResourceSchema), createResource);
router.patch('/:id', roleGuard('authority', 'admin'), validateBody(updateResourceSchema), updateResource);
router.delete('/:id', roleGuard('authority', 'admin'), deleteResource);
router.post('/:id/allocate', roleGuard('authority', 'admin'), validateBody(allocateResourceSchema), allocateResource);
router.post('/:id/release', roleGuard('authority', 'admin'), validateBody(releaseResourceSchema), releaseResource);

export default router;
