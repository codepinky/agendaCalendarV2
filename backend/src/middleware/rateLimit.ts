import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para registro de usuários
 * Previne criação massiva de contas e brute force
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas por IP por hora
  message: {
    error: 'Too many registration attempts from this IP, please try again after an hour.',
  },
  standardHeaders: true, // Retorna rate limit info nos headers
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Conta todas as tentativas, mesmo as bem-sucedidas
});

/**
 * Rate limiter para validação de licenses
 * Previne brute force de códigos de license
 */
export const licenseValidationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 tentativas por IP por hora (aumentado para permitir testes)
  message: {
    error: 'Muitas tentativas de validação. Por favor, aguarde 1 hora antes de tentar novamente.',
    details: 'Você excedeu o limite de 50 tentativas por hora. Isso ajuda a proteger o sistema contra tentativas de força bruta.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Não contar requisições bem-sucedidas (validações de códigos válidos)
  skipSuccessfulRequests: true,
});

/**
 * Rate limiter para webhooks
 * Previne spam de webhooks
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: {
    error: 'Too many webhook requests, please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Não aplicar rate limit se tiver secret válido (webhooks legítimos)
  skip: (req) => {
    const secret = req.header('x-webhook-secret');
    const expectedSecret = process.env.WEBHOOK_BRIDGE_SECRET;
    return secret === expectedSecret;
  },
});

/**
 * Rate limiter geral para API
 * Proteção básica contra DDoS
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por IP a cada 15 minutos
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});





