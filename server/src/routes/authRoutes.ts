import { Router } from 'express';
import { register, login, getCurrentUser, logout } from '../controllers/authController';
import { validateBody, registerSchema, loginSchema } from '../utils/validators';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', logout);

export default router;
