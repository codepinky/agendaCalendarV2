import { Router } from 'express';
import { validateLicense } from '../controllers/licensesController';
import { licenseValidationLimiter } from '../middleware/rateLimit';
import { validateLicenseCode } from '../middleware/validation';

const router = Router();

// Rate limiting na validação (20 tentativas por hora)
router.post('/validate', licenseValidationLimiter, validateLicenseCode, validateLicense);

export default router;

