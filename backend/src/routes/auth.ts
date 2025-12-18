import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { registerLimiter } from '../middleware/rateLimit';

const router = Router();

// Rate limiting no registro (5 tentativas por hora)
router.post('/register', registerLimiter, register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;

