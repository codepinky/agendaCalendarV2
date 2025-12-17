import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createSlot, getSlots, deleteSlot } from '../services/slotsService';
import { AvailableSlot } from '../types';
import { validateDate, validateTime, sanitizeString } from '../utils/validation';

export const createSlotHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { date, startTime, endTime, maxBookings = 1 } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Date, startTime and endTime are required' });
    }

    // Validate and sanitize
    if (!validateDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    if (!validateTime(startTime) || !validateTime(endTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:mm' });
    }

    const sanitizedDate = sanitizeString(date);
    const sanitizedStartTime = sanitizeString(startTime);
    const sanitizedEndTime = sanitizeString(endTime);

    // Validate endTime > startTime
    if (endTime <= startTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const slotData: Omit<AvailableSlot, 'id' | 'createdAt'> = {
      date: sanitizedDate,
      startTime: sanitizedStartTime,
      endTime: sanitizedEndTime,
      status: 'available',
      maxBookings: Number(maxBookings) || 1,
    };

    const slot = await createSlot(req.user.uid, slotData);

    return res.status(201).json(slot);
  } catch (error: any) {
    console.error('Error creating slot:', error);
    
    if (error.message === 'Time slot conflicts with existing slot') {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSlotsHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const slots = await getSlots(req.user.uid);
    return res.json(slots);
  } catch (error) {
    console.error('Error getting slots:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSlotHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    await deleteSlot(req.user.uid, id);
    
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting slot:', error);
    
    if (error.message === 'Slot not found') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

