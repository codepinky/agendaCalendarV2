import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createSlot, getSlots, deleteSlot } from '../services/slotsService';
import { AvailableSlot } from '../types';
import { sanitizeString } from '../utils/validation';
import { logger } from '../utils/logger';

export const createSlotHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validação básica já feita pelo express-validator
    const { date, startTime, endTime, bufferMinutes = 0 } = req.body;
    // maxBookings sempre será 1 (removido do frontend, mantido para compatibilidade)

    // Validação adicional: se data é hoje, verificar que hora não é no passado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);
    
    if (slotDate.getTime() === today.getTime()) {
      const now = new Date();
      const [startHour, startMin] = startTime.split(':').map(Number);
      const slotStartTime = new Date();
      slotStartTime.setHours(startHour, startMin, 0, 0);
      
      if (slotStartTime < now) {
        return res.status(400).json({ 
          error: 'Não é possível criar horário com hora no passado',
          details: `A hora de início (${startTime}) já passou. Selecione uma hora futura.`
        });
      }
    }

    // Sanitize (express-validator já normaliza, mas mantemos sanitização adicional)
    const sanitizedDate = sanitizeString(date);
    const sanitizedStartTime = sanitizeString(startTime);
    const sanitizedEndTime = sanitizeString(endTime);

    // Validate bufferMinutes (must be >= 0 and reasonable, max 24 hours)
    const buffer = Math.max(0, Math.min(Number(bufferMinutes) || 0, 1440)); // Max 24 hours

    const slotData: Omit<AvailableSlot, 'id' | 'createdAt'> = {
      date: sanitizedDate,
      startTime: sanitizedStartTime,
      endTime: sanitizedEndTime,
      status: 'available',
      maxBookings: 1, // Sempre 1 agendamento por slot
      bufferMinutes: buffer,
    };

    const slot = await createSlot(req.user.uid, slotData);

    return res.status(201).json(slot);
  } catch (error: any) {
    logger.error('Error creating slot', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
    });
    
    // Handle conflict errors (direct overlap or buffer violations)
    if (error.message && error.message.includes('Time slot conflicts with existing slot')) {
      return res.status(409).json({ 
        error: 'Conflito de horário',
        details: error.message
      });
    }

    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao criar o horário. Tente novamente mais tarde.'
    });
  }
};

export const getSlotsHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para acessar esta informação'
      });
    }

    const slots = await getSlots(req.user.uid);
    return res.json(slots);
  } catch (error: any) {
    logger.error('Error getting slots', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
    });
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao buscar os horários. Tente novamente mais tarde.'
    });
  }
};

export const deleteSlotHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para acessar esta informação'
      });
    }

    const { id } = req.params;
    await deleteSlot(req.user.uid, id);
    
    return res.json({ success: true });
  } catch (error: any) {
    logger.error('Error deleting slot', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      slotId: req.params.id,
      ip: req.ip,
    });
    
    if (error.message === 'Slot not found') {
      return res.status(404).json({ 
        error: 'Horário não encontrado',
        details: 'O horário que você está tentando deletar não existe mais'
      });
    }
    
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ 
        error: 'Não é possível deletar este horário',
        details: error.message
      });
    }

    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao deletar o horário. Tente novamente mais tarde.'
    });
  }
};


