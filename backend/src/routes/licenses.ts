import { Router } from 'express';
import { validateLicense } from '../controllers/licensesController';

const router = Router();

router.post('/validate', validateLicense);

export default router;

