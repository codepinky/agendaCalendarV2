import { processBookingTransaction } from '../../utils/transactions';
import { db } from '../../services/firebase';
import { AvailableSlot, Booking } from '../../types';
import type admin from 'firebase-admin';

// Mock Firebase
jest.mock('../../services/firebase');

describe('transactions', () => {
  const mockUserId = 'user123';
  const mockSlotId = 'slot123';
  const mockBookingId = 'booking123';

  const mockSlot: AvailableSlot = {
    id: mockSlotId,
    date: '2025-12-20',
    startTime: '14:00',
    endTime: '15:00',
    status: 'available',
    maxBookings: 1,
    createdAt: '2025-12-18T10:00:00Z',
  };

  const mockBookingData: Omit<Booking, 'id' | 'orderNumber' | 'reservedAt' | 'confirmedAt'> = {
    slotId: mockSlotId,
    date: '2025-12-20',
    startTime: '14:00',
    endTime: '15:00',
    clientName: 'João Silva',
    clientEmail: 'joao@exemplo.com',
    clientPhone: '(11) 98765-4321',
    notes: 'Cliente prefere manhã',
    status: 'pending',
  };

  // Mock Firestore transaction
  const mockTransaction = {
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1703001234567);
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('processBookingTransaction', () => {
    it('deve criar booking quando slot está disponível', async () => {
      const mockSlotDoc = {
        exists: true,
        data: () => mockSlot,
      };

      const mockConfirmedBookings = {
        size: 0,
      };

      const mockPendingBookings = {
        size: 0,
      };

      const mockBookingRef = {
        id: mockBookingId,
      };

      const mockSlotRef = {};
      const mockBookingsRef = {
        where: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnValue(mockBookingRef),
      };

      // Setup mocks para a estrutura do Firestore
      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockImplementation((subCollection: string) => {
                if (subCollection === 'availableSlots') {
                  return {
                    doc: jest.fn().mockReturnValue(mockSlotRef),
                  };
                }
                if (subCollection === 'bookings') {
                  return mockBookingsRef;
                }
                return {};
              }),
            }),
          };
        }
        return {};
      });

      // Mock transaction.get
      let callCount = 0;
      mockTransaction.get.mockImplementation((refOrQuery: any) => {
        callCount++;
        // Primeira chamada: slotRef
        if (callCount === 1) {
          return Promise.resolve(mockSlotDoc);
        }
        // Segunda chamada: query confirmed bookings
        if (callCount === 2) {
          return Promise.resolve(mockConfirmedBookings);
        }
        // Terceira chamada: query pending bookings
        if (callCount === 3) {
          return Promise.resolve(mockPendingBookings);
        }
        return Promise.resolve({ size: 0 });
      });

      // Mock db.runTransaction
      (db.runTransaction as jest.Mock).mockImplementation(
        async (callback: (transaction: admin.firestore.Transaction) => Promise<any>) => {
          return await callback(mockTransaction as any);
        }
      );

      const result = await processBookingTransaction(mockUserId, mockSlotId, mockBookingData);

      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      expect(result.booking?.id).toBe(mockBookingId);
      expect(result.booking?.status).toBe('confirmed');
      expect(result.booking?.clientName).toBe('João Silva');
      expect(mockTransaction.set).toHaveBeenCalled();
    });

    it('deve lançar erro quando slot não existe', async () => {
      const mockSlotDoc = {
        exists: false,
      };

      const mockSlotRef = {};

      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue(mockSlotRef),
          }),
        }),
      });

      mockTransaction.get.mockResolvedValue(mockSlotDoc);

      (db.runTransaction as jest.Mock).mockImplementation(
        async (callback: (transaction: admin.firestore.Transaction) => Promise<any>) => {
          return await callback(mockTransaction as any);
        }
      );

      await expect(
        processBookingTransaction(mockUserId, mockSlotId, mockBookingData)
      ).rejects.toThrow('Slot not found');
    });

    it('deve lançar erro quando slot não está disponível', async () => {
      const unavailableSlot: AvailableSlot = {
        ...mockSlot,
        status: 'reserved',
      };

      const mockSlotDoc = {
        exists: true,
        data: () => unavailableSlot,
      };

      const mockSlotRef = {};

      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            doc: jest.fn().mockReturnValue(mockSlotRef),
          }),
        }),
      });

      mockTransaction.get.mockResolvedValue(mockSlotDoc);

      (db.runTransaction as jest.Mock).mockImplementation(
        async (callback: (transaction: admin.firestore.Transaction) => Promise<any>) => {
          return await callback(mockTransaction as any);
        }
      );

      await expect(
        processBookingTransaction(mockUserId, mockSlotId, mockBookingData)
      ).rejects.toThrow('Slot is not available');
    });

    it('deve lançar erro quando slot está totalmente reservado', async () => {
      const mockSlotDoc = {
        exists: true,
        data: () => mockSlot,
      };

      // Mock: já tem 1 booking confirmado (maxBookings = 1)
      const mockConfirmedBookings = {
        size: 1,
      };

      const mockPendingBookings = {
        size: 0,
      };

      const mockSlotRef = {};
      const mockBookingsRef = {
        where: jest.fn().mockReturnThis(),
      };

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockImplementation((subCollection: string) => {
                if (subCollection === 'availableSlots') {
                  return {
                    doc: jest.fn().mockReturnValue(mockSlotRef),
                  };
                }
                if (subCollection === 'bookings') {
                  return mockBookingsRef;
                }
                return {};
              }),
            }),
          };
        }
        return {};
      });

      // Mock transaction.get com contador de chamadas
      let callCount = 0;
      mockTransaction.get.mockImplementation((refOrQuery: any) => {
        callCount++;
        // Primeira chamada: slotRef
        if (callCount === 1) {
          return Promise.resolve(mockSlotDoc);
        }
        // Segunda chamada: query confirmed bookings
        if (callCount === 2) {
          return Promise.resolve(mockConfirmedBookings);
        }
        // Terceira chamada: query pending bookings
        if (callCount === 3) {
          return Promise.resolve(mockPendingBookings);
        }
        return Promise.resolve({ size: 0 });
      });

      (db.runTransaction as jest.Mock).mockImplementation(
        async (callback: (transaction: admin.firestore.Transaction) => Promise<any>) => {
          return await callback(mockTransaction as any);
        }
      );

      await expect(
        processBookingTransaction(mockUserId, mockSlotId, mockBookingData)
      ).rejects.toThrow('Slot is fully booked');
    });

    it('deve contar bookings confirmados e pendentes para prevenir race conditions', async () => {
      const mockSlotDoc = {
        exists: true,
        data: () => mockSlot,
      };

      // Mock: tem 1 booking pendente (ainda não confirmado, mas conta)
      const mockConfirmedBookings = {
        size: 0,
      };

      const mockPendingBookings = {
        size: 1, // Já tem 1 pendente
      };

      const mockSlotRef = {};
      const mockBookingsRef = {
        where: jest.fn().mockReturnThis(),
      };

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockImplementation((subCollection: string) => {
                if (subCollection === 'availableSlots') {
                  return {
                    doc: jest.fn().mockReturnValue(mockSlotRef),
                  };
                }
                if (subCollection === 'bookings') {
                  return mockBookingsRef;
                }
                return {};
              }),
            }),
          };
        }
        return {};
      });

      // Mock transaction.get com contador de chamadas
      let callCount = 0;
      mockTransaction.get.mockImplementation((refOrQuery: any) => {
        callCount++;
        // Primeira chamada: slotRef
        if (callCount === 1) {
          return Promise.resolve(mockSlotDoc);
        }
        // Segunda chamada: query confirmed bookings
        if (callCount === 2) {
          return Promise.resolve(mockConfirmedBookings);
        }
        // Terceira chamada: query pending bookings
        if (callCount === 3) {
          return Promise.resolve(mockPendingBookings);
        }
        return Promise.resolve({ size: 0 });
      });

      (db.runTransaction as jest.Mock).mockImplementation(
        async (callback: (transaction: admin.firestore.Transaction) => Promise<any>) => {
          return await callback(mockTransaction as any);
        }
      );

      // Deve lançar erro porque totalBookings (0 + 1) >= maxBookings (1)
      await expect(
        processBookingTransaction(mockUserId, mockSlotId, mockBookingData)
      ).rejects.toThrow('Slot is fully booked');
    });

    it('deve atualizar status do slot para reserved quando totalmente reservado', async () => {
      const slotWithMultipleBookings: AvailableSlot = {
        ...mockSlot,
        maxBookings: 2,
      };

      const mockSlotDoc = {
        exists: true,
        data: () => slotWithMultipleBookings,
      };

      // Mock: já tem 1 booking confirmado, vai criar o 2º (total = 2, max = 2)
      const mockConfirmedBookings = {
        size: 1,
      };

      const mockPendingBookings = {
        size: 0,
      };

      const mockBookingRef = {
        id: mockBookingId,
      };

      const mockSlotRef = {};
      const mockBookingsRef = {
        where: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnValue(mockBookingRef),
      };

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockImplementation((subCollection: string) => {
                if (subCollection === 'availableSlots') {
                  return {
                    doc: jest.fn().mockReturnValue(mockSlotRef),
                  };
                }
                if (subCollection === 'bookings') {
                  return mockBookingsRef;
                }
                return {};
              }),
            }),
          };
        }
        return {};
      });

      // Mock transaction.get com contador de chamadas
      let callCount = 0;
      mockTransaction.get.mockImplementation((refOrQuery: any) => {
        callCount++;
        // Primeira chamada: slotRef
        if (callCount === 1) {
          return Promise.resolve(mockSlotDoc);
        }
        // Segunda chamada: query confirmed bookings
        if (callCount === 2) {
          return Promise.resolve(mockConfirmedBookings);
        }
        // Terceira chamada: query pending bookings
        if (callCount === 3) {
          return Promise.resolve(mockPendingBookings);
        }
        return Promise.resolve({ size: 0 });
      });

      (db.runTransaction as jest.Mock).mockImplementation(
        async (callback: (transaction: admin.firestore.Transaction) => Promise<any>) => {
          return await callback(mockTransaction as any);
        }
      );

      const result = await processBookingTransaction(mockUserId, mockSlotId, mockBookingData);

      expect(result.success).toBe(true);
      // Deve atualizar slot para 'reserved' porque totalBookings (1 + 1) >= maxBookings (2)
      expect(mockTransaction.update).toHaveBeenCalledWith(
        mockSlotRef,
        { status: 'reserved' }
      );
    });

    it('deve atualizar slot com _lastBookingAt quando ainda há vagas', async () => {
      const slotWithMultipleBookings: AvailableSlot = {
        ...mockSlot,
        maxBookings: 3,
      };

      const mockSlotDoc = {
        exists: true,
        data: () => slotWithMultipleBookings,
      };

      // Mock: tem 1 booking, vai criar o 2º (total = 2, max = 3, ainda tem vaga)
      const mockConfirmedBookings = {
        size: 1,
      };

      const mockPendingBookings = {
        size: 0,
      };

      const mockBookingRef = {
        id: mockBookingId,
      };

      const mockSlotRef = {};
      const mockBookingsRef = {
        where: jest.fn().mockReturnThis(),
        doc: jest.fn().mockReturnValue(mockBookingRef),
      };

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockImplementation((subCollection: string) => {
                if (subCollection === 'availableSlots') {
                  return {
                    doc: jest.fn().mockReturnValue(mockSlotRef),
                  };
                }
                if (subCollection === 'bookings') {
                  return mockBookingsRef;
                }
                return {};
              }),
            }),
          };
        }
        return {};
      });

      // Mock transaction.get com contador de chamadas
      let callCount = 0;
      mockTransaction.get.mockImplementation((refOrQuery: any) => {
        callCount++;
        // Primeira chamada: slotRef
        if (callCount === 1) {
          return Promise.resolve(mockSlotDoc);
        }
        // Segunda chamada: query confirmed bookings
        if (callCount === 2) {
          return Promise.resolve(mockConfirmedBookings);
        }
        // Terceira chamada: query pending bookings
        if (callCount === 3) {
          return Promise.resolve(mockPendingBookings);
        }
        return Promise.resolve({ size: 0 });
      });

      (db.runTransaction as jest.Mock).mockImplementation(
        async (callback: (transaction: admin.firestore.Transaction) => Promise<any>) => {
          return await callback(mockTransaction as any);
        }
      );

      const result = await processBookingTransaction(mockUserId, mockSlotId, mockBookingData);

      expect(result.success).toBe(true);
      // Deve atualizar slot com _lastBookingAt para detectar conflitos
      expect(mockTransaction.update).toHaveBeenCalledWith(
        mockSlotRef,
        expect.objectContaining({
          _lastBookingAt: expect.any(String),
        })
      );
    });
  });
});
