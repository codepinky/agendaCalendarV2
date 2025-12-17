import { Router } from 'express';
import { getAvailableSlots, createBookingHandler } from '../controllers/bookingsController';

const router = Router();

router.get('/slots/:publicLink', getAvailableSlots);
router.post('/', createBookingHandler);

export default router;

