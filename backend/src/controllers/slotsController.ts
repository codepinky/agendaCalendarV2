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

    const { date, startTime, endTime, bufferMinutes = 0 } = req.body;
    // maxBookings sempre será 1 (removido do frontend, mantido para compatibilidade)

    if (!date || !startTime || !endTime) {
      const missingFields = [];
      if (!date) missingFields.push('data');
      if (!startTime) missingFields.push('hora de início');
      if (!endTime) missingFields.push('hora de fim');
      
      return res.status(400).json({ 
        error: 'Todos os campos são obrigatórios',
        details: `Campos faltando: ${missingFields.join(', ')}`
      });
    }

    // Validate and sanitize
    if (!validateDate(date)) {
      return res.status(400).json({ 
        error: 'Formato de data inválido',
        details: 'Use o formato YYYY-MM-DD (exemplo: 2025-12-20)'
      });
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const slotDate = new Date(date);
    slotDate.setHours(0, 0, 0, 0);
    
    if (slotDate < today) {
      return res.status(400).json({ 
        error: 'Não é possível criar horário para uma data no passado',
        details: 'Selecione uma data de hoje ou futura'
      });
    }

    // If date is today, validate that times are not in the past
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

    if (!validateTime(startTime) || !validateTime(endTime)) {
      const invalidFields = [];
      if (!validateTime(startTime)) invalidFields.push('hora de início');
      if (!validateTime(endTime)) invalidFields.push('hora de fim');
      
      return res.status(400).json({ 
        error: 'Formato de hora inválido',
        details: `Use o formato HH:mm (exemplo: 14:30) para: ${invalidFields.join(', ')}`
      });
    }

    const sanitizedDate = sanitizeString(date);
    const sanitizedStartTime = sanitizeString(startTime);
    const sanitizedEndTime = sanitizeString(endTime);

    // Validate endTime > startTime
    if (endTime <= startTime) {
      return res.status(400).json({ 
        error: 'A hora de fim deve ser posterior à hora de início',
        details: `Hora de início: ${startTime}, Hora de fim: ${endTime}`
      });
    }

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
    console.error('Error creating slot:', error);
    
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
  } catch (error) {
    console.error('Error getting slots:', error);
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
    console.error('Error deleting slot:', error);
    
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


