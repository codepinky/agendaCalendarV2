import { Request, Response } from 'express';
import { db } from '../services/firebase';
import { License } from '../types';

export const validateLicense = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'License code is required' });
    }

    const licenseRef = db.collection('licenses').doc(code);
    const licenseDoc = await licenseRef.get();

    if (!licenseDoc.exists) {
      return res.status(404).json({ error: 'License code not found' });
    }

    const licenseData = licenseDoc.data() as License;

    if (licenseData.status !== 'active') {
      return res.status(400).json({ error: 'License is not active' });
    }

    if (licenseData.usedAt) {
      return res.status(400).json({ error: 'License code already used' });
    }

    return res.json({
      valid: true,
      email: licenseData.email,
      license: {
        code: licenseData.code,
        email: licenseData.email,
      },
    });
  } catch (error) {
    console.error('Error validating license:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

