import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAvailableSlots, createBookingHandler, getMyBookings } from '../controllers/bookingsController';

const router = Router();

// Public routes
router.get('/slots/:publicLink', getAvailableSlots);
router.post('/', createBookingHandler);

// Protected routes (require authentication)
router.get('/my-bookings', authenticate, getMyBookings);

export default router;

