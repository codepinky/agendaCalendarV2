import { db } from './firebase';
import { AvailableSlot } from '../types';
import { parseSaoPauloDateTimeToTimestamp, getCurrentDateTimeInSaoPaulo } from '../utils/timezone';
import { logger } from '../utils/logger';
import { Timestamp } from 'firebase-admin/firestore';

export const createSlot = async (userId: string, slotData: Omit<AvailableSlot, 'id' | 'createdAt'>) => {
  const slotsRef = db.collection('users').doc(userId).collection('availableSlots');
  
  // Validate no conflicts
  const existingSlots = await slotsRef
    .where('date', '==', slotData.date)
    .where('status', 'in', ['available', 'reserved', 'confirmed'])
    .get();

  for (const doc of existingSlots.docs) {
    const existing = doc.data() as AvailableSlot;
    
    // Convert times to minutes for easier comparison
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const newStart = timeToMinutes(slotData.startTime);
    const newEnd = timeToMinutes(slotData.endTime);
    const existingStart = timeToMinutes(existing.startTime);
    const existingEnd = timeToMinutes(existing.endTime);
    
    // Get buffers from both slots
    const existingBuffer = existing.bufferMinutes || 0;
    const newBuffer = slotData.bufferMinutes || 0;
    
    // Buffer applies AFTER a slot ends
    // Example: Slot 13:30-14:30 with buffer 60min
    //   → Next slot cannot start before 15:30 (14:30 + 60min)
    
    // Check for direct overlap (slots overlapping each other)
    const hasDirectOverlap = (
      (newStart < existingEnd && newEnd > existingStart) ||
      (newStart <= existingStart && newEnd >= existingEnd) ||
      (existingStart <= newStart && existingEnd >= newEnd)
    );
    
    if (hasDirectOverlap) {
      throw new Error('Time slot conflicts with existing slot');
    }
    
    // Check if new slot starts too early (within existing slot's buffer zone)
    // New slot cannot start before: existingEnd + existingBuffer
    // Use < to allow starting exactly at the end of buffer zone (newStart == existingEnd + existingBuffer is OK)
    if (newStart < existingEnd + existingBuffer) {
      throw new Error(`Time slot conflicts with existing slot. Minimum interval required: ${existingBuffer} minutes after the previous slot ends`);
    }
    
    // Check if existing slot ends too late (within new slot's buffer zone)
    // If new slot has buffer, we need at least newBuffer minutes between existingEnd and newStart
    // So: newStart - existingEnd >= newBuffer
    // Which means: existingEnd <= newStart - newBuffer
    // If existingEnd > newStart - newBuffer, then there's not enough buffer
    if (newBuffer > 0 && existingEnd > newStart - newBuffer) {
      throw new Error(`Time slot conflicts with existing slot. Minimum interval required: ${newBuffer} minutes before this slot starts`);
    }
  }

  // Calcular slotDateTime (timestamp) para queries eficientes no Firestore
  const slotDateTime = parseSaoPauloDateTimeToTimestamp(slotData.date, slotData.startTime);

  const newSlot: Omit<AvailableSlot, 'id'> = {
    ...slotData,
    createdAt: new Date().toISOString(),
    slotDateTime, // Adicionar timestamp calculado para queries eficientes
  };

  const docRef = await slotsRef.add(newSlot);
  
  return {
    id: docRef.id,
    ...newSlot,
  };
};

export const getSlots = async (userId: string, options?: { limit?: number; offset?: number; status?: string[]; includePast?: boolean }) => {
  const slotsRef = db.collection('users').doc(userId).collection('availableSlots');
  
  // OPTIMIZATION: Add Firestore filters if provided
  let query: FirebaseFirestore.Query = slotsRef;
  
  // OPTIMIZATION: Use slotDateTime for efficient Firestore queries
  // This filters both date AND time directly in Firestore, avoiding unnecessary data transfer
  // Note: Slots without slotDateTime field won't be returned (only new slots have this field)
  const nowInSaoPaulo = getCurrentDateTimeInSaoPaulo(); // Get current Date object in SP timezone
  const nowTimestamp = Timestamp.fromDate(nowInSaoPaulo); // Convert to Firestore Timestamp
  
  if (options?.includePast === true) {
    // Para histórico: retornar apenas slots que JÁ PASSARAM
    query = query.where('slotDateTime', '<', nowTimestamp);
    logger.info('Filtrando slots PASSADOS por slotDateTime no Firestore (histórico)', {
      nowISO: nowInSaoPaulo.toISOString(),
      nowTimestamp: nowTimestamp.toDate().toISOString(),
      includePast: options?.includePast,
    });
  } else {
    // Para ativos: retornar apenas slots FUTUROS (ainda não passaram)
    query = query.where('slotDateTime', '>=', nowTimestamp);
    logger.info('Filtrando slots FUTUROS por slotDateTime no Firestore (ativos)', {
      nowISO: nowInSaoPaulo.toISOString(),
      nowTimestamp: nowTimestamp.toDate().toISOString(),
      includePast: options?.includePast,
    });
  }
  
  if (options?.status && options.status.length > 0) {
    // Firestore 'in' operator supports up to 10 values
    if (options.status.length <= 10) {
      query = query.where('status', 'in', options.status);
    }
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  const snapshot = await query.get();
  
  const slots = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as AvailableSlot));
  
  // OPTIMIZATION: With slotDateTime query, Firestore already filters past slots efficiently
  // No need for additional in-memory filtering - the query does it all at the database level
  // This reduces data transfer and improves performance
  logger.info('Slots retornados do Firestore (já filtrados por slotDateTime)', {
    totalSlots: slots.length,
    includePast: options?.includePast,
  });
  
  // Sort in memory: first by date, then by startTime
  // For past slots (includePast=true), sort descending (most recent first)
  // For future slots (includePast=false), sort ascending (earliest first)
  const sorted = slots.sort((a, b) => {
    if (a.date !== b.date) {
      if (options?.includePast === true) {
        return b.date.localeCompare(a.date); // Descending for past slots
      }
      return a.date.localeCompare(b.date); // Ascending for future slots
    }
    if (options?.includePast === true) {
      return b.startTime.localeCompare(a.startTime); // Descending for past slots
    }
    return a.startTime.localeCompare(b.startTime); // Ascending for future slots
  });
  
  // Apply offset if provided (after sorting)
  if (options?.offset) {
    return sorted.slice(options.offset);
  }
  
  return sorted;
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

