import { Router } from 'express';
import {
  getAllShelters,
  getShelterById,
  createShelter,
  updateShelter,
  deleteShelter,
} from '../controllers/shelterController';
import { authenticate } from '../middleware/authMiddleware';
import { roleGuard } from '../middleware/roleGuard';
import {
  validateBody,
  createShelterSchema,
  updateShelterSchema,
} from '../utils/validators';

const router = Router();

router.get('/', authenticate, getAllShelters);
router.get('/:id', authenticate, getShelterById);

router.post(
  '/',
  authenticate,
  roleGuard('authority', 'admin'),
  validateBody(createShelterSchema),
  createShelter,
);

router.patch(
  '/:id',
  authenticate,
  roleGuard('authority', 'admin'),
  validateBody(updateShelterSchema),
  updateShelter,
);

router.delete(
  '/:id',
  authenticate,
  roleGuard('authority', 'admin'),
  deleteShelter,
);

export default router;
