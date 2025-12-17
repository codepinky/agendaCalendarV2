import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { initiateAuth, handleCallback, disconnect } from '../controllers/googleCalendarController';

const router = Router();

router.get('/auth', authenticate, initiateAuth);
router.get('/callback', handleCallback);
router.post('/disconnect', authenticate, disconnect);

export default router;

