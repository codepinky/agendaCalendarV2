import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db } from '../services/firebase';
import { getAuthUrl, getTokensFromCode, getCalendarId } from '../services/googleCalendarService';

export const initiateAuth = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const authUrl = getAuthUrl(req.user.uid);
    
    return res.json({ authUrl });
  } catch (error) {
    console.error('Error initiating Google Calendar auth:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
  } catch (error) {
    console.error('Error handling Google Calendar callback:', error);
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
  } catch (error) {
    console.error('Error disconnecting Google Calendar:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

