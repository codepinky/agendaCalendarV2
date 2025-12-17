import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createSlotHandler, getSlotsHandler, deleteSlotHandler } from '../controllers/slotsController';

const router = Router();

// All slots routes require authentication
router.use(authenticate);

router.post('/', createSlotHandler);
router.get('/', getSlotsHandler);
router.delete('/:id', deleteSlotHandler);

export default router;

