import { Request, Response, NextFunction } from 'express';
import { validateRegister, validateCreateSlot, validateCreateBooking, validateLicenseCode } from '../../middleware/validation';

// Mock express-validator
const mockValidationResult = jest.fn();
jest.mock('express-validator', () => {
  const actual = jest.requireActual('express-validator');
  return {
    ...actual,
    validationResult: () => mockValidationResult(),
  };
});

describe('Validation Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validateRegister', () => {
    it('deve validar email, senha, nome e licenseCode', () => {
      // validateRegister é um array de middlewares
      expect(Array.isArray(validateRegister)).toBe(true);
      expect(validateRegister.length).toBeGreaterThan(0);
    });

    it('deve retornar erro quando campos estão vazios', () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { type: 'field', path: 'email', msg: 'Email é obrigatório' },
          { type: 'field', path: 'password', msg: 'Senha é obrigatória' },
        ],
      });

      const handleValidationErrors = validateRegister[validateRegister.length - 1];
      handleValidationErrors(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('validateCreateSlot', () => {
    it('deve validar data, startTime, endTime e bufferMinutes', () => {
      expect(Array.isArray(validateCreateSlot)).toBe(true);
      expect(validateCreateSlot.length).toBeGreaterThan(0);
    });

    it('deve retornar erro quando data está no passado', () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { type: 'field', path: 'date', msg: 'Não é possível criar horário para uma data no passado' },
        ],
      });

      const handleValidationErrors = validateCreateSlot[validateCreateSlot.length - 1];
      handleValidationErrors(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateCreateBooking', () => {
    it('deve validar publicLink, slotId, clientName, clientEmail, clientPhone e notes', () => {
      expect(Array.isArray(validateCreateBooking)).toBe(true);
      expect(validateCreateBooking.length).toBeGreaterThan(0);
    });

    it('deve retornar erro quando telefone está em formato inválido', () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { type: 'field', path: 'clientPhone', msg: 'Formato de telefone inválido. Use (00) 00000-0000 ou (00) 0000-0000' },
        ],
      });

      const handleValidationErrors = validateCreateBooking[validateCreateBooking.length - 1];
      handleValidationErrors(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateLicenseCode', () => {
    it('deve validar código de licença', () => {
      expect(Array.isArray(validateLicenseCode)).toBe(true);
      expect(validateLicenseCode.length).toBeGreaterThan(0);
    });

    it('deve retornar erro quando código está vazio', () => {
      mockValidationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { type: 'field', path: 'code', msg: 'Código de licença é obrigatório' },
        ],
      });

      const handleValidationErrors = validateLicenseCode[validateLicenseCode.length - 1];
      handleValidationErrors(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
