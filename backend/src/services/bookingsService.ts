import { db } from './firebase';
import { Booking, AvailableSlot } from '../types';
import { processBookingTransaction } from '../utils/transactions';
import { createCalendarEvent } from './googleCalendarService';

export const getAvailableSlotsByPublicLink = async (publicLink: string) => {
  // Find user by public link
  const usersRef = db.collection('users');
  const userSnapshot = await usersRef.where('publicLink', '==', publicLink).limit(1).get();

  if (userSnapshot.empty) {
    throw new Error('Public link not found');
  }

  const userId = userSnapshot.docs[0].id;
  const slotsRef = db.collection('users').doc(userId).collection('availableSlots');
  
  // Get all slots and filter/order in memory (avoids Firestore index requirement)
  const slotsSnapshot = await slotsRef.get();

  const allSlots = slotsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as AvailableSlot));

  // Filter by status and sort in memory
  const slots = allSlots
    .filter(slot => slot.status === 'available' || slot.status === 'reserved')
    .sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.startTime.localeCompare(b.startTime);
    });

  // Filter out fully booked slots
  const availableSlots = [];
  for (const slot of slots) {
    const bookingsRef = db.collection('users').doc(userId).collection('bookings');
    const confirmedBookings = await bookingsRef
      .where('slotId', '==', slot.id)
      .where('status', '==', 'confirmed')
      .get();

    if (confirmedBookings.size < slot.maxBookings) {
      availableSlots.push(slot);
    }
  }

  return {
    userId,
    slots: availableSlots,
  };
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

export const getUserBookings = async (userId: string) => {
  const bookingsRef = db.collection('users').doc(userId).collection('bookings');
  const snapshot = await bookingsRef.get();
  
  const bookings = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Booking));
  
  // Sort by date (descending) and then by startTime (ascending)
  // Most recent bookings first, then by time within the same date
  return bookings.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date); // Descending (newest first)
    }
    return a.startTime.localeCompare(b.startTime); // Ascending (earlier first)
  });
};

