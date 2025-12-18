import { Request, Response } from 'express';
import { auth, db } from '../services/firebase';
import { User } from '../types';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { logger, logSuspiciousActivity, logSecurityError } from '../utils/logger';

export const register = async (req: Request, res: Response) => {
  try {
    // Validação básica já feita pelo express-validator
    const { email, password, name, licenseCode } = req.body;

    const licenseRef = db.collection('licenses').doc(licenseCode);

    // Use transaction to ensure atomicity (prevents race condition)
    // Only one person can use the same license code at the same time
    const result = await db.runTransaction(async (tx) => {
      // Check license in transaction
      const licenseDoc = await tx.get(licenseRef);

    if (!licenseDoc.exists) {
      logSecurityError('LICENSE_NOT_FOUND', {
        ip: req.ip,
        endpoint: '/api/auth/register',
        licenseCode: licenseCode.substring(0, 8) + '...', // Log parcial por segurança
      });
      throw new Error('LICENSE_NOT_FOUND');
    }

    const licenseData = licenseDoc.data();

    if (licenseData?.status !== 'active') {
      logSecurityError('LICENSE_NOT_ACTIVE', {
        ip: req.ip,
        endpoint: '/api/auth/register',
        licenseCode: licenseCode.substring(0, 8) + '...',
      });
      throw new Error('LICENSE_NOT_ACTIVE');
    }

    if (licenseData?.usedAt) {
      logSecurityError('LICENSE_ALREADY_USED', {
        ip: req.ip,
        endpoint: '/api/auth/register',
        licenseCode: licenseCode.substring(0, 8) + '...',
      });
      throw new Error('LICENSE_ALREADY_USED');
    }

      // Mark license as used IMMEDIATELY in transaction (before creating user)
      // This prevents race condition where two people try to use same code
      const now = new Date().toISOString();
      tx.update(licenseRef, {
        usedAt: now,
        status: 'inactive',
      });

      return { success: true };
    });

    // If we get here, license was successfully marked as used
    // Now create the user (if this fails, we'll need to handle rollback manually)
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
      });
    } catch (authError: any) {
      // If user creation fails, we need to rollback the license
      // (in production, you might want a more sophisticated recovery mechanism)
      if (authError.code === 'auth/email-already-exists') {
        // License already marked as used, but email exists
        // This is a conflict - license is consumed but user exists
        // In this case, we'll keep license as used (it was valid attempt)
        return res.status(400).json({ 
          error: 'Email already registered. Please login instead.' 
        });
      }
      
      // Other auth errors - rollback license
      await licenseRef.update({
        usedAt: null,
        status: 'active',
      });
      
      throw authError;
    }

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
    logger.error('Error registering user', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      email: req.body.email?.substring(0, 5) + '...', // Log parcial
    });
    
    // Handle transaction errors
    if (error.message === 'LICENSE_NOT_FOUND') {
      return res.status(404).json({ 
        error: 'Código de licença não encontrado',
        details: 'Verifique se o código foi digitado corretamente'
      });
    }
    
    if (error.message === 'LICENSE_NOT_ACTIVE') {
      return res.status(400).json({ 
        error: 'Código de licença não está ativo',
        details: 'Esta licença não pode ser usada no momento'
      });
    }
    
    if (error.message === 'LICENSE_ALREADY_USED') {
      return res.status(400).json({ 
        error: 'Código de licença já foi utilizado',
        details: 'Cada código de licença só pode ser usado uma vez. Se você já possui uma conta, faça login.'
      });
    }
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ 
        error: 'Este email já está cadastrado',
        details: 'Se você já possui uma conta, faça login. Caso contrário, use outro email.'
      });
    }

    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const missingFields = [];
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('senha');
      
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios',
        details: `Campos faltando: ${missingFields.join(', ')}`
      });
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
      return res.status(401).json({ 
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para acessar esta informação'
      });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ 
        error: 'Usuário não encontrado',
        details: 'Seu perfil não foi encontrado no sistema. Entre em contato com o suporte.'
      });
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

