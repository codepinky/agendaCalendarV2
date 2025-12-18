import { db } from '../services/firebase';
import { AvailableSlot, Booking } from '../types';
import type admin from 'firebase-admin';

export const processBookingTransaction = async (
  userId: string,
  slotId: string,
  bookingData: Omit<Booking, 'id' | 'orderNumber' | 'reservedAt' | 'confirmedAt'>
): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
  return await db.runTransaction(async (transaction: admin.firestore.Transaction) => {
    const slotRef = db.collection('users').doc(userId).collection('availableSlots').doc(slotId);
    const slotDoc = await transaction.get(slotRef);

    if (!slotDoc.exists) {
      throw new Error('Slot not found');
    }

    const slot = slotDoc.data() as AvailableSlot;

    if (slot.status !== 'available') {
      throw new Error('Slot is not available');
    }

    // Get current bookings count for this slot
    // IMPORTANT: Count both 'confirmed' and 'pending' bookings to prevent race conditions
    // If we only count 'confirmed', two simultaneous transactions could both pass
    const bookingsRef = db.collection('users').doc(userId).collection('bookings');
    const confirmedBookings = await transaction.get(
      bookingsRef.where('slotId', '==', slotId).where('status', '==', 'confirmed')
    );
    const pendingBookings = await transaction.get(
      bookingsRef.where('slotId', '==', slotId).where('status', '==', 'pending')
    );

    // Count all active bookings (confirmed + pending) to prevent double booking
    const totalBookings = confirmedBookings.size + pendingBookings.size;

    if (totalBookings >= slot.maxBookings) {
      throw new Error('Slot is fully booked');
    }

    // Generate order number (timestamp + random)
    const orderNumber = Date.now() + Math.floor(Math.random() * 1000);
    const reservedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    const confirmedAt = new Date().toISOString();

    // Create booking directly as 'confirmed' since we're in an atomic transaction
    // This ensures the booking is immediately counted in future transactions
    const bookingRef = bookingsRef.doc();
    const newBooking: Omit<Booking, 'id'> = {
      ...bookingData,
      orderNumber,
      reservedAt,
      expiresAt,
      status: 'confirmed',
      confirmedAt,
    };

    transaction.set(bookingRef, newBooking);

    // Always update the slot to ensure Firestore detects conflicts between concurrent transactions
    // This forces transaction retry if another booking is being created simultaneously
    // The update ensures that if two transactions try to book the same slot, one will be retried
    if (totalBookings + 1 >= slot.maxBookings) {
      // Slot is now fully booked - update status
      transaction.update(slotRef, { status: 'reserved' });
    } else {
      // Update slot with a version field to ensure conflict detection
      // This ensures Firestore will detect if another transaction modified the slot
      // We use a partial update that doesn't break the type
      transaction.update(slotRef, { 
        // Add a metadata field that helps with conflict detection
        // This field is optional and won't break existing code
        _lastBookingAt: new Date().toISOString() 
      } as Partial<AvailableSlot> & { _lastBookingAt?: string });
    }

    return {
      success: true,
      booking: {
        id: bookingRef.id,
        ...newBooking,
      } as Booking,
    };
  });
};



