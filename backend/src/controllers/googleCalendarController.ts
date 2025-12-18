import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../services/firebase';
import { getAuthUrl, getTokensFromCode, getCalendarId } from '../services/googleCalendarService';
import { logger } from '../utils/logger';

export const initiateAuth = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authUrl = getAuthUrl(req.user.uid);
    
    return res.json({ authUrl });
  } catch (error: any) {
    logger.error('Error initiating Google Calendar auth', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
    });
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao iniciar autenticação do Google Calendar. Tente novamente mais tarde.'
    });
  }
};

export const handleCallback = async (req: any, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'Code and state are required' });
    }

    const userId = state;

    // Get tokens
    const tokens = await getTokensFromCode(code as string);

    if (!tokens.access_token || !tokens.refresh_token) {
      return res.status(400).json({ error: 'Failed to get tokens' });
    }

    // Get calendar ID
    const calendarId = await getCalendarId(tokens.access_token);

    // Save to Firebase
    await db.collection('users').doc(userId as string).update({
      googleCalendarId: calendarId,
      googleCalendarAccessToken: tokens.access_token,
      googleCalendarRefreshToken: tokens.refresh_token,
      googleCalendarConnected: true,
      googleCalendarConnectedAt: new Date().toISOString(),
    });

    // Redirect to frontend
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/dashboard?googleCalendarConnected=true`);
  } catch (error: any) {
    logger.error('Error handling Google Calendar callback', {
      error: error.message,
      stack: error.stack,
      code: req.query.code,
      state: req.query.state,
      ip: req.ip,
    });
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/dashboard?googleCalendarError=true`);
  }
};

export const disconnect = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await db.collection('users').doc(req.user.uid).update({
      googleCalendarId: null,
      googleCalendarAccessToken: null,
      googleCalendarRefreshToken: null,
      googleCalendarConnected: false,
    });

    return res.json({ success: true });
  } catch (error: any) {
    logger.error('Error disconnecting Google Calendar', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
    });
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao desconectar o Google Calendar. Tente novamente mais tarde.'
    });
  }
};

