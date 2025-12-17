import { db } from '../services/firebase';
import { AvailableSlot, Booking } from '../types';

export const processBookingTransaction = async (
  userId: string,
  slotId: string,
  bookingData: Omit<Booking, 'id' | 'orderNumber' | 'reservedAt' | 'confirmedAt'>
): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
  return await db.runTransaction(async (transaction) => {
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
    const bookingsRef = db.collection('users').doc(userId).collection('bookings');
    const bookingsSnapshot = await transaction.get(
      bookingsRef.where('slotId', '==', slotId).where('status', '==', 'confirmed')
    );

    const confirmedCount = bookingsSnapshot.size;

    if (confirmedCount >= slot.maxBookings) {
      throw new Error('Slot is fully booked');
    }

    // Generate order number (timestamp + random)
    const orderNumber = Date.now() + Math.floor(Math.random() * 1000);
    const reservedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Create booking
    const bookingRef = bookingsRef.doc();
    const newBooking: Omit<Booking, 'id'> = {
      ...bookingData,
      orderNumber,
      reservedAt,
      expiresAt,
      status: 'pending',
    };

    transaction.set(bookingRef, newBooking);

    // Update slot if needed
    if (confirmedCount + 1 >= slot.maxBookings) {
      transaction.update(slotRef, { status: 'reserved' });
    }

    // Confirm booking immediately (since we're in transaction)
    transaction.update(bookingRef, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
    });

    return {
      success: true,
      booking: {
        id: bookingRef.id,
        ...newBooking,
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
      } as Booking,
    };
  });
};

