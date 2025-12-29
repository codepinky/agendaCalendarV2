import { db } from './firebase';
import { Booking, AvailableSlot, User } from '../types';
import { processBookingTransaction } from '../utils/transactions';
import { createCalendarEvent } from './googleCalendarService';
import { slotsCache, getCacheKey, clearCache } from './cacheService';
import { getTodayInSaoPaulo, isSlotInPast } from '../utils/timezone';
import { logger } from '../utils/logger';

export const getAvailableSlotsByPublicLink = async (publicLink: string) => {
  // CACHE: Verificar se já está em cache
  const cacheKey = getCacheKey.slots(publicLink);
  const cachedResult = slotsCache.get<{ userId: string; slots: AvailableSlot[] }>(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }

  // Find user by public link
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('publicLink', '==', publicLink).limit(1).get();

  if (userSnapshot.empty) {
    throw new Error('Public link not found');
  }

  const userId = userSnapshot.docs[0].id;
  const slotsRef = db.collection('users').doc(userId).collection('availableSlots');
  
  // Get current date in São Paulo timezone for filtering future slots
  const today = getTodayInSaoPaulo();
  
  // OPTIMIZATION: Filter by status and date in Firestore to reduce data transfer
  // Only get slots that are available/reserved and today or in the future
  // Note: We still need to filter by time after fetching because Firestore
  // only compares dates, not date+time
  const slotsSnapshot = await slotsRef
    .where('status', 'in', ['available', 'reserved'])
    .where('date', '>=', today)
    .get();

  const allSlots = slotsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as AvailableSlot));

  // Sort in memory (date and time)
  const slots = allSlots.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // OPTIMIZATION: Get ALL confirmed bookings for all slots in ONE query instead of N queries
  // This eliminates the N+1 query problem
  const bookingsRef = db.collection('users').doc(userId).collection('bookings');
  const allBookingsSnapshot = await bookingsRef
    .where('status', '==', 'confirmed')
    .get();

  // Group bookings by slotId for O(1) lookup
  const bookingsBySlotId = new Map<string, number>();
  allBookingsSnapshot.docs.forEach(doc => {
    const booking = doc.data() as Booking;
    const count = bookingsBySlotId.get(booking.slotId) || 0;
    bookingsBySlotId.set(booking.slotId, count + 1);
  });

  // Filter out slots that have already passed (considering date + time in São Paulo timezone)
  // and fully booked slots
  const availableSlots = slots.filter(slot => {
    // Skip slots that have already passed
    if (isSlotInPast(slot)) {
      return false;
    }
    
    // Check if slot is fully booked
    const confirmedCount = bookingsBySlotId.get(slot.id) || 0;
    return confirmedCount < slot.maxBookings;
  });

  const result = {
    userId,
    slots: availableSlots,
  };

  // CACHE: Armazenar resultado (TTL: 1 minuto - dados mudam com frequência)
  slotsCache.set(cacheKey, result);

  return result;
};

export const createBooking = async (
  publicLink: string,
  slotId: string,
  bookingData: Omit<Booking, 'id' | 'slotId' | 'orderNumber' | 'reservedAt' | 'confirmedAt' | 'status' | 'date' | 'startTime' | 'endTime'>
) => {
  // Find user by public link
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('publicLink', '==', publicLink).limit(1).get();

  if (userSnapshot.empty) {
    throw new Error('Public link not found');
  }

  const userId = userSnapshot.docs[0].id;

  // Get slot to get date and times
  const slotRef = db.collection('users').doc(userId).collection('availableSlots').doc(slotId);
  const slotDoc = await slotRef.get();

  if (!slotDoc.exists) {
    throw new Error('Slot not found');
  }

  const slot = slotDoc.data() as AvailableSlot;

  const fullBookingData: Omit<Booking, 'id' | 'orderNumber' | 'reservedAt' | 'confirmedAt'> = {
    ...bookingData,
    slotId,
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    status: 'pending',
  };

  const result = await processBookingTransaction(userId, slotId, fullBookingData);

  if (!result.success || !result.booking) {
    throw new Error(result.error || 'Failed to create booking');
  }

  // CACHE: Limpar cache de slots quando um booking é criado
  // (os slots disponíveis mudaram)
  clearCache.slots(publicLink);

  // Create event in Google Calendar (async, don't wait)
  createCalendarEvent(userId, {
    date: slot.date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    clientName: bookingData.clientName,
    clientEmail: bookingData.clientEmail,
    clientPhone: bookingData.clientPhone,
    notes: bookingData.notes,
  }).catch(error => {
    console.error('Error creating Google Calendar event:', error);
    // Don't fail the booking if calendar event creation fails
  });

  return {
    booking: result.booking,
    userId,
    slot,
  };
};

export const getUserBookings = async (userId: string, options?: { limit?: number; offset?: number }) => {
  const bookingsRef = db.collection('users').doc(userId).collection('bookings');
  
  // OPTIMIZATION: If pagination is requested, use Firestore limit
  // Otherwise, get all (for backward compatibility)
  let query: FirebaseFirestore.Query = bookingsRef;
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const snapshot = await query.get();
  
  const bookings = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Booking));
  
  // Sort by date (descending) and then by startTime (ascending)
  // Most recent bookings first, then by time within the same date
  const sorted = bookings.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date); // Descending (newest first)
    }
    return a.startTime.localeCompare(b.startTime); // Ascending (earlier first)
  });
  
  // Apply offset if provided (after sorting)
  if (options?.offset) {
    return sorted.slice(options.offset);
  }
  
  return sorted;
};

export const getPublicProfileByLink = async (publicLink: string) => {
  // Find user by public link
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('publicLink', '==', publicLink).limit(1).get();

  if (userSnapshot.empty) {
    throw new Error('Public link not found');
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data() as User;

  const settings = userData.settings || {};
  const publicProfile = settings.publicProfile || {};

  // Return public profile data
  return {
    name: userData.name,
    publicTitle: settings.publicTitle || userData.name,
    socialLinks: settings.socialLinks || {},
    // Novos campos do perfil público
    profileImageUrl: publicProfile.profileImageUrl,
    bannerImageUrl: publicProfile.bannerImageUrl,
    bannerPositionX: publicProfile.bannerPositionX ?? 50, // Padrão: centro (50%)
    bannerPositionY: publicProfile.bannerPositionY ?? 50, // Padrão: centro (50%)
    backgroundImageUrl: publicProfile.backgroundImageUrl,
    description: publicProfile.description,
    mainUsername: publicProfile.mainUsername,
  };
};

