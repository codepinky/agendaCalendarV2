// Shared TypeScript types (same as frontend)

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

export interface PublicProfile {
  profileImageUrl?: string;      // URL da foto de perfil
  bannerImageUrl?: string;        // URL do banner
  backgroundImageUrl?: string;    // URL da foto de fundo
  description?: string;           // Bio/descrição (max 500 chars)
  mainUsername?: string;          // @principal (ex: @joaosilva)
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  telegram?: string;
  whatsapp?: string;
  tiktok?: string;
  youtube?: string;
}

export interface UserSettings {
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultInterval?: number;
  availableDays?: number[];
  maxBookings?: number;
  publicTitle?: string;
  socialLinks?: SocialLinks;
  publicProfile?: PublicProfile;
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



