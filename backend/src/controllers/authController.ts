import { Request, Response } from 'express';
import { auth, db } from '../services/firebase';
import { User } from '../types';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, licenseCode } = req.body;

    // Validation
    if (!email || !password || !name || !licenseCode) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate license
    const licenseRef = db.collection('licenses').doc(licenseCode);
    const licenseDoc = await licenseRef.get();

    if (!licenseDoc.exists) {
      return res.status(404).json({ error: 'License code not found' });
    }

    const licenseData = licenseDoc.data();

    if (licenseData?.status !== 'active') {
      return res.status(400).json({ error: 'License is not active' });
    }

    if (licenseData?.usedAt) {
      return res.status(400).json({ error: 'License code already used' });
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // Generate public link
    const publicLink = crypto.randomBytes(16).toString('hex');

    // Create user document
    const userData: Omit<User, 'id'> = {
      email,
      name,
      licenseCode,
      publicLink,
      googleCalendarConnected: false,
      settings: {},
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Mark license as used
    await licenseRef.update({
      usedAt: new Date().toISOString(),
      status: 'inactive',
    });

    // Get custom token for frontend
    const customToken = await auth.createCustomToken(userRecord.uid);

    return res.json({
      success: true,
      user: {
        id: userRecord.uid,
        email,
        name,
        publicLink,
      },
      token: customToken,
    });
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email already registered' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Note: Firebase Admin SDK doesn't have signInWithEmailAndPassword
    // This should be handled by Firebase Auth on the frontend
    // Backend will verify the token sent from frontend
    return res.status(501).json({ error: 'Login should be handled by Firebase Auth on frontend' });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data() as User;

    return res.json({
      ...userData,
      id: req.user.uid,
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

