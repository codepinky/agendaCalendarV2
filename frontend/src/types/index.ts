// Shared TypeScript types between frontend and backend

export interface License {
  code: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  usedAt?: string;
  purchaseData?: any;
}

export interface User {
  id: string;
  email: string;
  name: string;
  licenseCode: string;
  publicLink: string;
  googleCalendarId?: string;
  googleCalendarAccessToken?: string;
  googleCalendarRefreshToken?: string;
  googleCalendarConnected?: boolean;
  googleCalendarConnectedAt?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultInterval?: number;
  availableDays?: number[];
  maxBookings?: number;
}

export interface AvailableSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: 'available' | 'reserved' | 'confirmed' | 'cancelled';
  createdAt: string;
  maxBookings: number;
  bufferMinutes?: number; // Intervalo em minutos entre agendamentos (ex: 30, 60)
}

export interface Booking {
  id: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  orderNumber: number;
  reservedAt: string;
  confirmedAt?: string;
  expiresAt?: string;
}

export interface ApiError {
  message: string;
  code?: string;
}



