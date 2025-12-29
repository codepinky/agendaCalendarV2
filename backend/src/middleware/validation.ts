// eslint-disable-next-line @typescript-eslint/no-var-requires
const { body, validationResult } = require('express-validator');
import { Request, Response, NextFunction } from 'express';
import { getTodayInSaoPaulo } from '../utils/timezone';

// Middleware para processar erros de validação
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err: any) => ({
      field: err.type === 'field' ? err.path : 'unknown',
      message: err.msg,
    }));
    
    const missingFields = errorMessages
      .filter((err: any) => err.message.includes('obrigatório'))
      .map((err: any) => err.field);
    
    const logger = require('../utils/logger').logger;
    logger.error('Validation errors', {
      endpoint: req.path,
      method: req.method,
      body: req.body,
      errors: errorMessages,
      missingFields,
    });
    
    return res.status(400).json({
      error: missingFields.length > 0 
        ? 'Todos os campos são obrigatórios'
        : 'Dados inválidos',
      details: missingFields.length > 0
        ? `Campos faltando: ${missingFields.join(', ')}`
        : errorMessages[0]?.message || 'Verifique os dados enviados',
      errors: errorMessages,
    });
  }
  
  next();
};

// Validações para registro
export const validateRegister = [
  body('email')
    .notEmpty()
    .withMessage('Email é obrigatório')
    .isEmail()
    .withMessage('Formato de email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 6 })
    .withMessage('A senha deve ter pelo menos 6 caracteres'),
  body('name')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .escape(),
  body('licenseCode')
    .notEmpty()
    .withMessage('Código de licença é obrigatório')
    .trim()
    .isLength({ min: 8, max: 50 })
    .withMessage('Código de licença inválido')
    .escape(),
  handleValidationErrors,
];

// Validações para criação de slot
export const validateCreateSlot = [
  body('date')
    .notEmpty()
    .withMessage('Data é obrigatória')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Formato de data inválido. Use YYYY-MM-DD')
    .custom((value: string) => {
      // Usar timezone de São Paulo para comparação correta
      const today = getTodayInSaoPaulo(); // Retorna YYYY-MM-DD
      const slotDate = value; // Já vem no formato YYYY-MM-DD
      
      // Comparação de strings YYYY-MM-DD funciona corretamente
      if (slotDate < today) {
        throw new Error('Não é possível criar horário para uma data no passado');
      }
      return true;
    }),
  body('startTime')
    .notEmpty()
    .withMessage('Hora de início é obrigatória')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora inválido. Use HH:mm'),
  body('endTime')
    .notEmpty()
    .withMessage('Hora de fim é obrigatória')
    .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de hora inválido. Use HH:mm')
    .custom((value: string, { req }: any) => {
      if (req.body.startTime && value <= req.body.startTime) {
        throw new Error('A hora de fim deve ser posterior à hora de início');
      }
      return true;
    }),
  body('bufferMinutes')
    .optional()
    .isInt({ min: 0, max: 1440 })
    .withMessage('Intervalo deve ser entre 0 e 1440 minutos (24 horas)'),
  handleValidationErrors,
];

// Validações para criação de booking
export const validateCreateBooking = [
  body('publicLink')
    .notEmpty()
    .withMessage('Link público é obrigatório')
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Link público inválido')
    .escape(),
  body('slotId')
    .notEmpty()
    .withMessage('ID do horário é obrigatório')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('ID do horário inválido')
    .escape(),
  body('clientName')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .escape(),
  body('clientEmail')
    .notEmpty()
    .withMessage('Email é obrigatório')
    .isEmail()
    .withMessage('Formato de email inválido')
    .normalizeEmail(),
  body('clientPhone')
    .notEmpty()
    .withMessage('Telefone é obrigatório')
    .trim()
    .matches(/^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/)
    .withMessage('Formato de telefone inválido. Use (00) 00000-0000 ou (00) 0000-0000'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
    .escape(),
  handleValidationErrors,
];

// Validações para validação de license
export const validateLicenseCode = [
  body('code')
    .notEmpty()
    .withMessage('Código de licença é obrigatório')
    .trim()
    .isLength({ min: 8, max: 50 })
    .withMessage('Código de licença inválido')
    .escape(),
  handleValidationErrors,
];

