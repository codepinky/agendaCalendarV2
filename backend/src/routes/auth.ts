import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { registerLimiter } from '../middleware/rateLimit';
import { validateRegister } from '../middleware/validation';

const router = Router();

// Rate limiting no registro (5 tentativas por hora)
// express-validator retorna array de middlewares, então usamos spread
router.post('/register', registerLimiter, ...validateRegister, register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router;

