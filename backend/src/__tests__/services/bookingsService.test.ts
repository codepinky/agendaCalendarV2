import { getAvailableSlotsByPublicLink, createBooking, getUserBookings } from '../../services/bookingsService';
import { db } from '../../services/firebase';
import { processBookingTransaction } from '../../utils/transactions';
import { createCalendarEvent } from '../../services/googleCalendarService';
import { AvailableSlot, Booking } from '../../types';

// Mock dependencies
jest.mock('../../services/firebase');
jest.mock('../../utils/transactions');
jest.mock('../../services/googleCalendarService');

describe('bookingsService', () => {
  const mockPublicLink = 'abc123def456';
  const mockUserId = 'user123';
  const mockSlotId = 'slot123';

  // Mock Firestore collection structure
  const mockUsersCollection = {
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn(),
    doc: jest.fn().mockReturnThis(),
  };

  const mockSlotsCollection = {
    get: jest.fn(),
    doc: jest.fn().mockReturnThis(),
  };

  const mockBookingsCollection = {
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    doc: jest.fn(),
  };

  const mockSlotDoc = {
    get: jest.fn(),
    exists: true,
    data: jest.fn(),
    id: mockSlotId,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
      if (collectionName === 'users') {
        return {
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              get: jest.fn(),
            }),
          }),
          doc: jest.fn().mockReturnValue({
            collection: jest.fn().mockImplementation((subCollection: string) => {
              if (subCollection === 'availableSlots') {
                return mockSlotsCollection;
              }
              if (subCollection === 'bookings') {
                return mockBookingsCollection;
              }
              return {};
            }),
          }),
        };
      }
      return {};
    });

    mockSlotsCollection.doc.mockReturnValue(mockSlotDoc);
  });

  describe('getAvailableSlotsByPublicLink', () => {
    it('deve retornar slots disponíveis quando link público existe', async () => {
      // Mock: usuário encontrado
      const mockUserDoc = {
        id: mockUserId,
      };

      (db.collection as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              empty: false,
              docs: [mockUserDoc],
            }),
          }),
        }),
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue(mockSlotsCollection),
        }),
      });

      // Mock: slots disponíveis
      const mockSlot1: AvailableSlot = {
        id: 'slot1',
        date: '2025-12-20',
        startTime: '10:00',
        endTime: '11:00',
        status: 'available',
        maxBookings: 1,
        createdAt: '2025-12-18T10:00:00Z',
      };

      const mockSlot2: AvailableSlot = {
        id: 'slot2',
        date: '2025-12-20',
        startTime: '14:00',
        endTime: '15:00',
        status: 'available',
        maxBookings: 1,
        createdAt: '2025-12-18T11:00:00Z',
      };

      mockSlotsCollection.get.mockResolvedValue({
        docs: [
          { id: 'slot1', data: () => mockSlot1 },
          { id: 'slot2', data: () => mockSlot2 },
        ],
      });

      // Mock: nenhum booking confirmado (slots estão disponíveis)
      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: mockUserId }],
                }),
              }),
            }),
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockImplementation((subCollection: string) => {
                if (subCollection === 'availableSlots') {
                  return {
                    get: jest.fn().mockResolvedValue({
                      docs: [
                        { id: 'slot1', data: () => mockSlot1 },
                        { id: 'slot2', data: () => mockSlot2 },
                      ],
                    }),
                  };
                }
                if (subCollection === 'bookings') {
                  return {
                    where: jest.fn().mockReturnValue({
                      where: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({
                          size: 0, // Nenhum booking confirmado
                        }),
                      }),
                    }),
                  };
                }
                return {};
              }),
            }),
          };
        }
        return {};
      });

      const result = await getAvailableSlotsByPublicLink(mockPublicLink);

      expect(result).toHaveProperty('userId', mockUserId);
      expect(result).toHaveProperty('slots');
      expect(Array.isArray(result.slots)).toBe(true);
    });

    it('deve lançar erro quando link público não existe', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              empty: true,
              docs: [],
            }),
          }),
        }),
      });

      await expect(getAvailableSlotsByPublicLink('invalid-link')).rejects.toThrow(
        'Public link not found'
      );
    });

    it('deve filtrar slots totalmente reservados', async () => {
      const mockSlot: AvailableSlot = {
        id: 'slot1',
        date: '2025-12-20',
        startTime: '10:00',
        endTime: '11:00',
        status: 'available',
        maxBookings: 1,
        createdAt: '2025-12-18T10:00:00Z',
      };

      // Mock: usuário encontrado
      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: mockUserId }],
                }),
              }),
            }),
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockImplementation((subCollection: string) => {
                if (subCollection === 'availableSlots') {
                  return {
                    get: jest.fn().mockResolvedValue({
                      docs: [{ id: 'slot1', data: () => mockSlot }],
                    }),
                  };
                }
                if (subCollection === 'bookings') {
                  return {
                    where: jest.fn().mockReturnValue({
                      where: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({
                          size: 1, // Slot já tem 1 booking (maxBookings = 1)
                        }),
                      }),
                    }),
                  };
                }
                return {};
              }),
            }),
          };
        }
        return {};
      });

      const result = await getAvailableSlotsByPublicLink(mockPublicLink);

      // Slot deve ser filtrado (não aparece porque está totalmente reservado)
      expect(result.slots).toHaveLength(0);
    });

    it('deve ordenar slots por data e hora', async () => {
      const mockSlot1: AvailableSlot = {
        id: 'slot1',
        date: '2025-12-21',
        startTime: '10:00',
        endTime: '11:00',
        status: 'available',
        maxBookings: 1,
        createdAt: '2025-12-18T10:00:00Z',
      };

      const mockSlot2: AvailableSlot = {
        id: 'slot2',
        date: '2025-12-20',
        startTime: '14:00',
        endTime: '15:00',
        status: 'available',
        maxBookings: 1,
        createdAt: '2025-12-18T11:00:00Z',
      };

      const mockSlot3: AvailableSlot = {
        id: 'slot3',
        date: '2025-12-20',
        startTime: '09:00',
        endTime: '10:00',
        status: 'available',
        maxBookings: 1,
        createdAt: '2025-12-18T09:00:00Z',
      };

      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: mockUserId }],
                }),
              }),
            }),
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockImplementation((subCollection: string) => {
                if (subCollection === 'availableSlots') {
                  return {
                    get: jest.fn().mockResolvedValue({
                      docs: [
                        { id: 'slot1', data: () => mockSlot1 },
                        { id: 'slot2', data: () => mockSlot2 },
                        { id: 'slot3', data: () => mockSlot3 },
                      ],
                    }),
                  };
                }
                if (subCollection === 'bookings') {
                  return {
                    where: jest.fn().mockReturnValue({
                      where: jest.fn().mockReturnValue({
                        get: jest.fn().mockResolvedValue({
                          size: 0,
                        }),
                      }),
                    }),
                  };
                }
                return {};
              }),
            }),
          };
        }
        return {};
      });

      const result = await getAvailableSlotsByPublicLink(mockPublicLink);

      // Deve estar ordenado: primeiro por data, depois por hora
      expect(result.slots[0].date).toBe('2025-12-20');
      expect(result.slots[0].startTime).toBe('09:00');
      expect(result.slots[1].date).toBe('2025-12-20');
      expect(result.slots[1].startTime).toBe('14:00');
      expect(result.slots[2].date).toBe('2025-12-21');
      expect(result.slots[2].startTime).toBe('10:00');
    });
  });

  describe('createBooking', () => {
    const mockBookingData = {
      clientName: 'João Silva',
      clientEmail: 'joao@exemplo.com',
      clientPhone: '(11) 98765-4321',
      notes: 'Cliente prefere manhã',
    };

    const mockSlot: AvailableSlot = {
      id: mockSlotId,
      date: '2025-12-20',
      startTime: '14:00',
      endTime: '15:00',
      status: 'available',
      maxBookings: 1,
      createdAt: '2025-12-18T10:00:00Z',
    };

    const mockBooking: Booking = {
      id: 'booking123',
      slotId: mockSlotId,
      date: '2025-12-20',
      startTime: '14:00',
      endTime: '15:00',
      clientName: 'João Silva',
      clientEmail: 'joao@exemplo.com',
      clientPhone: '(11) 98765-4321',
      notes: 'Cliente prefere manhã',
      status: 'confirmed',
      orderNumber: 1703001234567,
      reservedAt: '2025-12-18T10:00:00Z',
      confirmedAt: '2025-12-18T10:00:00Z',
    };

    it('deve criar booking quando dados são válidos', async () => {
      // Mock: usuário encontrado
      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: mockUserId }],
                }),
              }),
            }),
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                  get: jest.fn().mockResolvedValue({
                    exists: true,
                    data: () => mockSlot,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Mock: transação bem-sucedida
      (processBookingTransaction as jest.Mock).mockResolvedValue({
        success: true,
        booking: mockBooking,
      });

      const result = await createBooking(mockPublicLink, mockSlotId, mockBookingData);

      expect(result).toHaveProperty('booking');
      expect(result).toHaveProperty('userId', mockUserId);
      expect(result).toHaveProperty('slot');
      expect(result.booking.clientName).toBe('João Silva');
      expect(result.booking.status).toBe('confirmed');
      expect(processBookingTransaction).toHaveBeenCalledWith(
        mockUserId,
        mockSlotId,
        expect.objectContaining({
          slotId: mockSlotId,
          date: mockSlot.date,
          startTime: mockSlot.startTime,
          endTime: mockSlot.endTime,
        })
      );
    });

    it('deve lançar erro quando link público não existe', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              empty: true,
              docs: [],
            }),
          }),
        }),
      });

      await expect(createBooking('invalid-link', mockSlotId, mockBookingData)).rejects.toThrow(
        'Public link not found'
      );
    });

    it('deve lançar erro quando slot não existe', async () => {
      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: mockUserId }],
                }),
              }),
            }),
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                  get: jest.fn().mockResolvedValue({
                    exists: false,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      await expect(createBooking(mockPublicLink, 'invalid-slot', mockBookingData)).rejects.toThrow(
        'Slot not found'
      );
    });

    it('deve lançar erro quando transação falha', async () => {
      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: mockUserId }],
                }),
              }),
            }),
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                  get: jest.fn().mockResolvedValue({
                    exists: true,
                    data: () => mockSlot,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      // Mock: transação falha
      (processBookingTransaction as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Slot is fully booked',
      });

      await expect(createBooking(mockPublicLink, mockSlotId, mockBookingData)).rejects.toThrow(
        'Slot is fully booked'
      );
    });

    it('deve criar evento no Google Calendar (async)', async () => {
      (db.collection as jest.Mock).mockImplementation((collectionName: string) => {
        if (collectionName === 'users') {
          return {
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue({
                  empty: false,
                  docs: [{ id: mockUserId }],
                }),
              }),
            }),
            doc: jest.fn().mockReturnValue({
              collection: jest.fn().mockReturnValue({
                doc: jest.fn().mockReturnValue({
                  get: jest.fn().mockResolvedValue({
                    exists: true,
                    data: () => mockSlot,
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      (processBookingTransaction as jest.Mock).mockResolvedValue({
        success: true,
        booking: mockBooking,
      });

      await createBooking(mockPublicLink, mockSlotId, mockBookingData);

      // Verificar que createCalendarEvent foi chamado
      expect(createCalendarEvent).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          date: mockSlot.date,
          startTime: mockSlot.startTime,
          endTime: mockSlot.endTime,
          clientName: mockBookingData.clientName,
          clientEmail: mockBookingData.clientEmail,
          clientPhone: mockBookingData.clientPhone,
        })
      );
    });
  });

  describe('getUserBookings', () => {
    it('deve retornar bookings ordenados por data (desc) e hora (asc)', async () => {
      const mockBooking1: Booking = {
        id: 'booking1',
        slotId: 'slot1',
        date: '2025-12-21',
        startTime: '10:00',
        endTime: '11:00',
        clientName: 'Cliente 1',
        clientEmail: 'cliente1@exemplo.com',
        clientPhone: '(11) 98765-4321',
        status: 'confirmed',
        orderNumber: 1703001234567,
        reservedAt: '2025-12-18T10:00:00Z',
        confirmedAt: '2025-12-18T10:00:00Z',
      };

      const mockBooking2: Booking = {
        id: 'booking2',
        slotId: 'slot2',
        date: '2025-12-20',
        startTime: '14:00',
        endTime: '15:00',
        clientName: 'Cliente 2',
        clientEmail: 'cliente2@exemplo.com',
        clientPhone: '(11) 98765-4322',
        status: 'confirmed',
        orderNumber: 1703001234568,
        reservedAt: '2025-12-18T11:00:00Z',
        confirmedAt: '2025-12-18T11:00:00Z',
      };

      const mockBooking3: Booking = {
        id: 'booking3',
        slotId: 'slot3',
        date: '2025-12-20',
        startTime: '09:00',
        endTime: '10:00',
        clientName: 'Cliente 3',
        clientEmail: 'cliente3@exemplo.com',
        clientPhone: '(11) 98765-4323',
        status: 'confirmed',
        orderNumber: 1703001234569,
        reservedAt: '2025-12-18T09:00:00Z',
        confirmedAt: '2025-12-18T09:00:00Z',
      };

      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              docs: [
                { id: 'booking1', data: () => mockBooking1 },
                { id: 'booking2', data: () => mockBooking2 },
                { id: 'booking3', data: () => mockBooking3 },
              ],
            }),
          }),
        }),
      });

      const result = await getUserBookings(mockUserId);

      // Deve estar ordenado: data desc (mais recente primeiro), hora asc (mais cedo primeiro)
      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2025-12-21'); // Data mais recente
      expect(result[1].date).toBe('2025-12-20');
      expect(result[1].startTime).toBe('09:00'); // Hora mais cedo primeiro
      expect(result[2].date).toBe('2025-12-20');
      expect(result[2].startTime).toBe('14:00');
    });

    it('deve retornar array vazio quando não há bookings', async () => {
      (db.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue({
          collection: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({
              docs: [],
            }),
          }),
        }),
      });

      const result = await getUserBookings(mockUserId);

      expect(result).toEqual([]);
    });
  });
});

