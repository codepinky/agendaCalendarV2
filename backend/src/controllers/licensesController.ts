import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { License } from '../types';
import { logger, logSuspiciousActivity } from '../utils/logger';
import { licenseCache, getCacheKey, clearCache } from '../services/cacheService';

export const validateLicense = async (req: Request, res: Response) => {
  try {
    // Validação básica já feita pelo express-validator
    const { code } = req.body;

    // CACHE: Verificar se já está em cache
    const cacheKey = getCacheKey.license(code);
    const cachedResult = licenseCache.get<{
      valid: boolean;
      email?: string;
      license?: any;
      error?: string;
      statusCode: number;
    }>(cacheKey);

    if (cachedResult) {
      // Retornar do cache (não logar como suspeito se for cache hit)
      return res.status(cachedResult.statusCode).json({
        valid: cachedResult.valid,
        email: cachedResult.email,
        license: cachedResult.license,
        error: cachedResult.error,
      });
    }

    // Buscar no Firestore
    const licenseRef = db.collection('licenses').doc(code);
    const licenseDoc = await licenseRef.get();

    let result: {
      valid: boolean;
      email?: string;
      license?: any;
      error?: string;
      statusCode: number;
    };

    if (!licenseDoc.exists) {
      logSuspiciousActivity('INVALID_LICENSE_CODE', {
        ip: req.ip,
        endpoint: '/api/licenses/validate',
        code: code.substring(0, 8) + '...', // Log parcial
      });
      
      result = {
        valid: false,
        error: 'License code not found',
        statusCode: 404,
      };
      
      // CACHE: Armazenar resultado negativo também (evita múltiplas queries)
      licenseCache.set(cacheKey, result);
      return res.status(404).json({ 
        valid: false,
        error: 'License code not found' 
      });
    }

    const licenseData = licenseDoc.data() as License;

    if (licenseData.status !== 'active') {
      logSuspiciousActivity('INACTIVE_LICENSE', {
        ip: req.ip,
        endpoint: '/api/licenses/validate',
        code: code.substring(0, 8) + '...',
      });
      
      result = {
        valid: false,
        error: 'License is not active',
        statusCode: 400,
      };
      
      licenseCache.set(cacheKey, result);
      return res.status(400).json({ 
        valid: false,
        error: 'License is not active' 
      });
    }

    if (licenseData.usedAt) {
      logSuspiciousActivity('USED_LICENSE_ATTEMPT', {
        ip: req.ip,
        endpoint: '/api/licenses/validate',
        code: code.substring(0, 8) + '...',
      });
      
      result = {
        valid: false,
        error: 'License code already used',
        statusCode: 400,
      };
      
      licenseCache.set(cacheKey, result);
      return res.status(400).json({ 
        valid: false,
        error: 'License code already used' 
      });
    }

    // License is valid and available
    result = {
      valid: true,
      email: licenseData.email,
      license: {
        code: licenseData.code,
        email: licenseData.email,
        status: licenseData.status,
        createdAt: licenseData.createdAt,
      },
      statusCode: 200,
    };
    
    // CACHE: Armazenar resultado válido
    licenseCache.set(cacheKey, result);
    
    return res.json({
      valid: true,
      email: licenseData.email,
      license: {
        code: licenseData.code,
        email: licenseData.email,
        status: licenseData.status,
        createdAt: licenseData.createdAt,
      },
    });
  } catch (error: any) {
    logger.error('Error validating license', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
    });
    return res.status(500).json({ 
      valid: false,
      error: 'Internal server error' 
    });
  }
};



