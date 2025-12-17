import { Response } from 'express';
import { getAvailableSlotsByPublicLink, createBooking } from '../services/bookingsService';
import { validateEmail, validatePhone, sanitizeString, sanitizeEmail } from '../utils/validation';

export const getAvailableSlots = async (req: any, res: Response) => {
  try {
    const { publicLink } = req.params;

    if (!publicLink) {
      return res.status(400).json({ error: 'Public link is required' });
    }

    const result = await getAvailableSlotsByPublicLink(publicLink);
    return res.json(result);
  } catch (error: any) {
    console.error('Error getting available slots:', error);
    
    if (error.message === 'Public link not found') {
      return res.status(404).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBookingHandler = async (req: any, res: Response) => {
  try {
    const { publicLink, slotId, clientName, clientEmail, clientPhone, notes } = req.body;

    if (!publicLink || !slotId || !clientName || !clientEmail || !clientPhone) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    // Validation
    if (!validateEmail(clientEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePhone(clientPhone)) {
      return res.status(400).json({ error: 'Invalid phone format' });
    }

    // Sanitize inputs
    const sanitizedData = {
      clientName: sanitizeString(clientName),
      clientEmail: sanitizeEmail(clientEmail),
      clientPhone: sanitizeString(clientPhone),
      notes: notes ? sanitizeString(notes) : '',
    };

    const result = await createBooking(publicLink, slotId, sanitizedData);

    return res.status(201).json({
      success: true,
      booking: result.booking,
      message: 'Booking confirmed successfully',
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    
    if (error.message === 'Public link not found' || error.message === 'Slot not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Slot is not available' || error.message === 'Slot is fully booked') {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

