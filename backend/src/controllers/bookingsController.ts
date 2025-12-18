import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAvailableSlotsByPublicLink, createBooking, getUserBookings } from '../services/bookingsService';
import { validateEmail, validatePhone, sanitizeString, sanitizeEmail } from '../utils/validation';
import { logger } from '../utils/logger';

export const getAvailableSlots = async (req: any, res: Response) => {
  try {
    const { publicLink } = req.params;

    if (!publicLink) {
      return res.status(400).json({ 
        error: 'Link público é obrigatório',
        details: 'O link público é necessário para buscar os horários disponíveis'
      });
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
      const missingFields = [];
      if (!publicLink) missingFields.push('link público');
      if (!slotId) missingFields.push('ID do horário');
      if (!clientName) missingFields.push('nome');
      if (!clientEmail) missingFields.push('email');
      if (!clientPhone) missingFields.push('telefone');
      
      return res.status(400).json({ 
        error: 'Todos os campos obrigatórios devem ser preenchidos',
        details: `Campos faltando: ${missingFields.join(', ')}`
      });
    }

    // Validation
    if (!validateEmail(clientEmail)) {
      return res.status(400).json({ 
        error: 'Formato de email inválido',
        details: 'O email deve estar no formato: exemplo@dominio.com'
      });
    }

    if (!validatePhone(clientPhone)) {
      return res.status(400).json({ 
        error: 'Formato de telefone inválido',
        details: 'Use o formato brasileiro: (00) 00000-0000 ou (00) 0000-0000'
      });
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
    
    if (error.message === 'Public link not found') {
      return res.status(404).json({ 
        error: 'Link público não encontrado',
        details: 'O link fornecido não existe ou está incorreto'
      });
    }
    
    if (error.message === 'Slot not found') {
      return res.status(404).json({ 
        error: 'Horário não encontrado',
        details: 'O horário selecionado não existe mais'
      });
    }
    
    if (error.message === 'Slot is not available') {
      return res.status(409).json({ 
        error: 'Horário não está disponível',
        details: 'Este horário não está mais disponível para agendamento'
      });
    }
    
    if (error.message === 'Slot is fully booked') {
      return res.status(409).json({ 
        error: 'Horário totalmente ocupado',
        details: 'Este horário já atingiu o número máximo de agendamentos'
      });
    }

    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao criar o agendamento. Tente novamente mais tarde.'
    });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para acessar esta informação'
      });
    }

    const bookings = await getUserBookings(req.user.uid);
    
    logger.info('User bookings retrieved', { 
      userId: req.user.uid, 
      count: bookings.length,
      ip: req.ip 
    });
    
    return res.json({ bookings });
  } catch (error: any) {
    logger.error('Error getting user bookings', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
    });
    
    return res.status(500).json({ error: 'Internal server error' });
  }
};

