import winston from 'winston';

/**
 * Logger configurado para produção
 * Registra erros, warnings e informações importantes
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'agenda-calendar-backend' },
  transports: [
    // Erros vão para error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Tudo vai para combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Em desenvolvimento, também loga no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

/**
 * Helper para logar tentativas suspeitas
 */
export const logSuspiciousActivity = (
  type: string,
  details: {
    ip?: string;
    endpoint?: string;
    user?: string;
    attempts?: number;
    [key: string]: any;
  }
) => {
  logger.warn('Suspicious activity detected', {
    type,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Helper para logar erros de segurança
 */
export const logSecurityError = (
  type: string,
  details: {
    ip?: string;
    endpoint?: string;
    reason?: string;
    [key: string]: any;
  }
) => {
  logger.error('Security error', {
    type,
    ...details,
    timestamp: new Date().toISOString(),
  });
};



