import { createSlot, getSlots, deleteSlot } from '../../services/slotsService';
import { db } from '../../services/firebase';
import { AvailableSlot } from '../../types';

// Mock Firebase
jest.mock('../../services/firebase');

describe('slotsService', () => {
  const mockUserId = 'user123';
  const mockSlotId = 'slot123';
  
  // Mock Firestore collection structure
  const mockSlotsCollection = {
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    add: jest.fn(),
    doc: jest.fn().mockReturnThis(),
  };

  const mockSlotDoc = {
    get: jest.fn(),
    delete: jest.fn(),
    exists: true,
    data: jest.fn(),
    id: mockSlotId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (db.collection as jest.Mock).mockReturnValue({
      doc: jest.fn().mockReturnValue({
        collection: jest.fn().mockReturnValue(mockSlotsCollection),
        get: jest.fn(),
        delete: jest.fn(),
      }),
    });

    mockSlotsCollection.doc.mockReturnValue(mockSlotDoc);
  });

  describe('createSlot', () => {
    const validSlotData: Omit<AvailableSlot, 'id' | 'createdAt'> = {
      date: '2025-12-20',
      startTime: '14:00',
      endTime: '15:00',
      status: 'available',
      maxBookings: 1,
      bufferMinutes: 30,
    };

    it('deve criar um slot quando não há conflitos', async () => {
      // Mock: não há slots existentes
      mockSlotsCollection.where.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [],
          }),
        }),
      });

      // Mock: adicionar novo slot
      const mockDocRef = { id: 'newSlot123' };
      mockSlotsCollection.add.mockResolvedValue(mockDocRef);

      const result = await createSlot(mockUserId, validSlotData);

      expect(result).toHaveProperty('id', 'newSlot123');
      expect(result).toHaveProperty('date', validSlotData.date);
      expect(result).toHaveProperty('startTime', validSlotData.startTime);
      expect(result).toHaveProperty('endTime', validSlotData.endTime);
      expect(result).toHaveProperty('createdAt');
    });

    it('deve lançar erro quando há conflito direto de horário', async () => {
      // Mock: slot existente com conflito direto
      const existingSlot: AvailableSlot = {
        id: 'existingSlot',
        date: '2025-12-20',
        startTime: '14:00',
        endTime: '15:00',
        status: 'available',
        maxBookings: 1,
        bufferMinutes: 0,
        createdAt: '2025-12-18T10:00:00Z',
      };

      mockSlotsCollection.where.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [{
              data: () => existingSlot,
            }],
          }),
        }),
      });

      await expect(createSlot(mockUserId, validSlotData)).rejects.toThrow(
        'Time slot conflicts with existing slot'
      );
    });

    it('deve lançar erro quando novo slot começa dentro do buffer do slot existente', async () => {
      // Slot existente: 13:30-14:30 com buffer de 60min
      // Próximo slot não pode começar antes de 15:30
      const existingSlot: AvailableSlot = {
        id: 'existingSlot',
        date: '2025-12-20',
        startTime: '13:30',
        endTime: '14:30',
        status: 'available',
        maxBookings: 1,
        bufferMinutes: 60, // Buffer de 60 minutos
        createdAt: '2025-12-18T10:00:00Z',
      };

      // Novo slot: 14:31-15:31 (começa muito cedo, dentro do buffer)
      const newSlotData: Omit<AvailableSlot, 'id' | 'createdAt'> = {
        date: '2025-12-20',
        startTime: '14:31',
        endTime: '15:31',
        status: 'available',
        maxBookings: 1,
        bufferMinutes: 0,
      };

      mockSlotsCollection.where.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [{
              data: () => existingSlot,
            }],
          }),
        }),
      });

      await expect(createSlot(mockUserId, newSlotData)).rejects.toThrow(
        'Time slot conflicts with existing slot. Minimum interval required: 60 minutes after the previous slot ends'
      );
    });

    it('deve permitir criar slot quando respeita o buffer', async () => {
      // Slot existente: 13:30-14:30 com buffer de 60min
      // Próximo slot pode começar em 15:30 ou depois
      const existingSlot: AvailableSlot = {
        id: 'existingSlot',
        date: '2025-12-20',
        startTime: '13:30',
        endTime: '14:30',
        status: 'available',
        maxBookings: 1,
        bufferMinutes: 60,
        createdAt: '2025-12-18T10:00:00Z',
      };

      // Novo slot: 15:30-16:30 (respeita o buffer)
      const newSlotData: Omit<AvailableSlot, 'id' | 'createdAt'> = {
        date: '2025-12-20',
        startTime: '15:30',
        endTime: '16:30',
        status: 'available',
        maxBookings: 1,
        bufferMinutes: 0,
      };

      mockSlotsCollection.where.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [{
              data: () => existingSlot,
            }],
          }),
        }),
      });

      const mockDocRef = { id: 'newSlot123' };
      mockSlotsCollection.add.mockResolvedValue(mockDocRef);

      const result = await createSlot(mockUserId, newSlotData);

      expect(result).toHaveProperty('id', 'newSlot123');
      expect(result.startTime).toBe('15:30');
    });

    it('deve lançar erro quando slot existente termina dentro do buffer do novo slot', async () => {
      // Novo slot: 15:00-16:00 com buffer de 30min
      // Slot existente não pode terminar depois de 14:30 (15:00 - 30min)
      const existingSlot: AvailableSlot = {
        id: 'existingSlot',
        date: '2025-12-20',
        startTime: '13:00',
        endTime: '14:31', // Termina muito tarde (dentro do buffer do novo slot)
        status: 'available',
        maxBookings: 1,
        bufferMinutes: 0,
        createdAt: '2025-12-18T10:00:00Z',
      };

      const newSlotData: Omit<AvailableSlot, 'id' | 'createdAt'> = {
        date: '2025-12-20',
        startTime: '15:00',
        endTime: '16:00',
        status: 'available',
        maxBookings: 1,
        bufferMinutes: 30, // Buffer de 30 minutos antes
      };

      mockSlotsCollection.where.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            docs: [{
              data: () => existingSlot,
            }],
          }),
        }),
      });

      await expect(createSlot(mockUserId, newSlotData)).rejects.toThrow(
        'Time slot conflicts with existing slot. Minimum interval required: 30 minutes before this slot starts'
      );
    });
  });

  describe('getSlots', () => {
    it('deve retornar slots ordenados por data e hora', async () => {
      const mockSlots = [
        {
          id: 'slot2',
          date: '2025-12-21',
          startTime: '10:00',
          endTime: '11:00',
          status: 'available',
          maxBookings: 1,
          createdAt: '2025-12-18T10:00:00Z',
        },
        {
          id: 'slot1',
          date: '2025-12-20',
          startTime: '14:00',
          endTime: '15:00',
          status: 'available',
          maxBookings: 1,
          createdAt: '2025-12-18T09:00:00Z',
        },
        {
          id: 'slot3',
          date: '2025-12-20',
          startTime: '09:00',
          endTime: '10:00',
          status: 'available',
          maxBookings: 1,
          createdAt: '2025-12-18T08:00:00Z',
        },
      ];

      mockSlotsCollection.get.mockResolvedValue({
        docs: mockSlots.map(slot => ({
          id: slot.id,
          data: () => slot,
        })),
      });

      const result = await getSlots(mockUserId);

      expect(result).toHaveLength(3);
      // Deve estar ordenado: primeiro por data, depois por hora
      expect(result[0].date).toBe('2025-12-20');
      expect(result[0].startTime).toBe('09:00');
      expect(result[1].date).toBe('2025-12-20');
      expect(result[1].startTime).toBe('14:00');
      expect(result[2].date).toBe('2025-12-21');
      expect(result[2].startTime).toBe('10:00');
    });

    it('deve retornar array vazio quando não há slots', async () => {
      mockSlotsCollection.get.mockResolvedValue({
        docs: [],
      });

      const result = await getSlots(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('deleteSlot', () => {
    it('deve deletar slot quando não há agendamentos confirmados', async () => {
      const slotData: AvailableSlot = {
        id: mockSlotId,
        date: '2025-12-20',
        startTime: '14:00',
        endTime: '15:00',
        status: 'available',
        maxBookings: 1,
        createdAt: '2025-12-18T10:00:00Z',
      };

      mockSlotDoc.get.mockResolvedValue({
        exists: true,
        data: () => slotData,
      });
      mockSlotDoc.delete.mockResolvedValue(undefined);

      const result = await deleteSlot(mockUserId, mockSlotId);

      expect(result).toEqual({ success: true });
      expect(mockSlotDoc.delete).toHaveBeenCalled();
    });

    it('deve lançar erro quando slot não existe', async () => {
      mockSlotDoc.get.mockResolvedValue({
        exists: false,
      });

      await expect(deleteSlot(mockUserId, mockSlotId)).rejects.toThrow(
        'Slot not found'
      );
    });

    it('deve lançar erro quando slot tem agendamentos confirmados', async () => {
      const slotData: AvailableSlot = {
        id: mockSlotId,
        date: '2025-12-20',
        startTime: '14:00',
        endTime: '15:00',
        status: 'confirmed',
        maxBookings: 1,
        createdAt: '2025-12-18T10:00:00Z',
      };

      mockSlotDoc.get.mockResolvedValue({
        exists: true,
        data: () => slotData,
      });

      await expect(deleteSlot(mockUserId, mockSlotId)).rejects.toThrow(
        'Cannot delete slot with confirmed bookings'
      );
    });
  });
});









