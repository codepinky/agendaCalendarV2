import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { License } from '../types';
import { logger, logSuspiciousActivity } from '../utils/logger';

export const validateLicense = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'License code is required' });
    }

    const licenseRef = db.collection('licenses').doc(code);
    const licenseDoc = await licenseRef.get();

    if (!licenseDoc.exists) {
      logSuspiciousActivity('INVALID_LICENSE_CODE', {
        ip: req.ip,
        endpoint: '/api/licenses/validate',
        code: code.substring(0, 8) + '...', // Log parcial
      });
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
      return res.status(400).json({ 
        valid: false,
        error: 'License code already used' 
      });
    }

    // License is valid and available
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



