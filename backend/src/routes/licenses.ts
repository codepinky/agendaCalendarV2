import { Router } from 'express';
import { validateLicense } from '../controllers/licensesController';
import { licenseValidationLimiter } from '../middleware/rateLimit';

const router = Router();

// Rate limiting na validação (20 tentativas por hora)
router.post('/validate', licenseValidationLimiter, validateLicense);

export default router;

