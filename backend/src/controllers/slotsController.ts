import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createSlot, getSlots, deleteSlot } from '../services/slotsService';
import { AvailableSlot } from '../types';
import { sanitizeString } from '../utils/validation';
import { logger } from '../utils/logger';
import { db } from '../services/firebase';
import { clearCache } from '../services/cacheService';
export const createSlotHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validação básica já feita pelo express-validator
    const { date, startTime, endTime, bufferMinutes = 0 } = req.body;
    // maxBookings sempre será 1 (removido do frontend, mantido para compatibilidade)

    // Validação adicional: se data é hoje, verificar que hora não é no passado
    // Usar timezone de São Paulo para comparação correta
    const { getTodayInSaoPaulo, getCurrentDateTimeInSaoPaulo } = require('../utils/timezone');
    const todayStr = getTodayInSaoPaulo(); // YYYY-MM-DD no timezone de São Paulo
    const slotDateStr = date; // Já vem no formato YYYY-MM-DD
    
    // Só validar hora se a data for exatamente hoje
    if (slotDateStr === todayStr) {
      const now = getCurrentDateTimeInSaoPaulo(); // Data/hora atual em São Paulo
      const [startHour, startMin] = startTime.split(':').map(Number);
      
      // Criar data/hora do slot em São Paulo
      const slotDateTime = new Date(now);
      slotDateTime.setHours(startHour, startMin, 0, 0);
      
      if (slotDateTime < now) {
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return res.status(400).json({ 
          error: 'Não é possível criar horário com hora no passado',
          details: `A hora de início (${startTime}) já passou. O horário precisa começar pelo menos às ${currentTime}.`
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

    // CACHE: Limpar cache de slots quando um novo slot é criado
    // Buscar publicLink do usuário para limpar cache específico
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.publicLink) {
          clearCache.slots(userData.publicLink);
        }
      }
    } catch (cacheError) {
      // Não falhar a criação do slot se limpeza de cache falhar
      logger.warn('Failed to clear slots cache', { error: cacheError, userId: req.user.uid });
    }

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

    // Parse query parameter includePast (default: false)
    const includePastParam = req.query.includePast;
    const includePast = includePastParam === 'true' || includePastParam === '1';
    
    
    logger.info('getSlotsHandler chamado', {
      includePastParam,
      includePast,
      userId: req.user.uid,
    });

    const slots = await getSlots(req.user.uid, { includePast });
    
    logger.info('getSlotsHandler retornando slots', {
      userId: req.user.uid,
      slotsCount: slots.length,
      includePast,
    });
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
    
    // CACHE: Limpar cache de slots quando um slot é deletado
    try {
      const userDoc = await db.collection('users').doc(req.user.uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.publicLink) {
          clearCache.slots(userData.publicLink);
        }
      }
    } catch (cacheError) {
      // Não falhar a deleção do slot se limpeza de cache falhar
      logger.warn('Failed to clear slots cache', { error: cacheError, userId: req.user.uid });
    }
    
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


