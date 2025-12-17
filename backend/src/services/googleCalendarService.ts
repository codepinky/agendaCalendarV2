import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import { db } from './firebase';
import { User } from '../types';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const getAuthUrl = (userId: string): string => {
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId, // Pass userId in state
  });
};

export const getTokensFromCode = async (code: string): Promise<Credentials> => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens as Credentials;
};

export const getCalendarId = async (accessToken: string): Promise<string> => {
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const response = await calendar.calendarList.list();
  const primaryCalendar = response.data.items?.find(cal => cal.primary) || response.data.items?.[0];
  
  if (!primaryCalendar?.id) {
    throw new Error('Could not find calendar ID');
  }
  
  return primaryCalendar.id;
};

export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  if (!credentials.access_token) {
    throw new Error('Failed to refresh access token');
  }
  
  return credentials.access_token;
};

export const createCalendarEvent = async (
  userId: string,
  bookingData: {
    date: string;
    startTime: string;
    endTime: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    notes?: string;
  }
): Promise<void> => {
  // Get user data
  const userDoc = await db.collection('users').doc(userId).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data() as User;

  if (!userData.googleCalendarId || !userData.googleCalendarAccessToken) {
    throw new Error('Google Calendar not connected');
  }

  let accessToken = userData.googleCalendarAccessToken;

  // Refresh token if needed
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    await google.calendar({ version: 'v3', auth: oauth2Client }).calendarList.list();
  } catch (error) {
    // Token expired, refresh it
    if (userData.googleCalendarRefreshToken) {
      accessToken = await refreshAccessToken(userData.googleCalendarRefreshToken);
      
      // Update token in Firebase
      await db.collection('users').doc(userId).update({
        googleCalendarAccessToken: accessToken,
      });
    } else {
      throw new Error('Access token expired and no refresh token available');
    }
  }

  // Create event
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const [year, month, day] = bookingData.date.split('-').map(Number);
  const [startHour, startMinute] = bookingData.startTime.split(':').map(Number);
  const [endHour, endMinute] = bookingData.endTime.split(':').map(Number);

  const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
  const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

  await calendar.events.insert({
    calendarId: userData.googleCalendarId,
    requestBody: {
      summary: `Agendamento - ${bookingData.clientName}`,
      description: `Cliente: ${bookingData.clientName}\nEmail: ${bookingData.clientEmail}\nTelefone: ${bookingData.clientPhone}${bookingData.notes ? `\nObservações: ${bookingData.notes}` : ''}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      attendees: [
        { email: bookingData.clientEmail },
      ],
    },
  });
};

