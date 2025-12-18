import { Router } from 'express';
import { kiwifyWebhook } from '../controllers/webhooksController';
import { webhookLimiter } from '../middleware/rateLimit';

const router = Router();

// Rate limiting em webhooks (100 por minuto, mas pula se tiver secret válido)
router.post('/kiwify', webhookLimiter, kiwifyWebhook);

export default router;


