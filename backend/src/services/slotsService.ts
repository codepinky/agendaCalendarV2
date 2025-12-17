import { db } from './firebase';
import { AvailableSlot } from '../types';

export const createSlot = async (userId: string, slotData: Omit<AvailableSlot, 'id' | 'createdAt'>) => {
  const slotsRef = db.collection('users').doc(userId).collection('availableSlots');
  
  // Validate no conflicts
  const existingSlots = await slotsRef
    .where('date', '==', slotData.date)
    .where('status', 'in', ['available', 'reserved', 'confirmed'])
    .get();

  for (const doc of existingSlots.docs) {
    const existing = doc.data() as AvailableSlot;
    
    // Check time overlap
    if (
      (slotData.startTime >= existing.startTime && slotData.startTime < existing.endTime) ||
      (slotData.endTime > existing.startTime && slotData.endTime <= existing.endTime) ||
      (slotData.startTime <= existing.startTime && slotData.endTime >= existing.endTime)
    ) {
      throw new Error('Time slot conflicts with existing slot');
    }
  }

  const newSlot: Omit<AvailableSlot, 'id'> = {
    ...slotData,
    createdAt: new Date().toISOString(),
  };

  const docRef = await slotsRef.add(newSlot);
  
  return {
    id: docRef.id,
    ...newSlot,
  };
};

export const getSlots = async (userId: string) => {
  const slotsRef = db.collection('users').doc(userId).collection('availableSlots');
  const snapshot = await slotsRef.orderBy('date').orderBy('startTime').get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as AvailableSlot));
};

export const deleteSlot = async (userId: string, slotId: string) => {
  const slotRef = db.collection('users').doc(userId).collection('availableSlots').doc(slotId);
  const slotDoc = await slotRef.get();
  
  if (!slotDoc.exists) {
    throw new Error('Slot not found');
  }

  const slotData = slotDoc.data() as AvailableSlot;
  
  // Only allow deletion if no confirmed bookings
  if (slotData.status === 'confirmed') {
    throw new Error('Cannot delete slot with confirmed bookings');
  }

  await slotRef.delete();
  return { success: true };
};

