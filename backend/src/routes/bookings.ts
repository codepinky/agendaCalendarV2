import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getAvailableSlots, createBookingHandler, getMyBookings, getPublicProfile } from '../controllers/bookingsController';
import { validateCreateBooking } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/bookings/slots/{publicLink}:
 *   get:
 *     summary: Obter horários disponíveis por link público
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: publicLink
 *         required: true
 *         schema:
 *           type: string
 *         description: Link público do usuário
 *     responses:
 *       200:
 *         description: Lista de horários disponíveis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 slots:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvailableSlot'
 *       404:
 *         description: Link público não encontrado
 */
router.get('/slots/:publicLink', getAvailableSlots);

/**
 * @swagger
 * /api/bookings/public-profile/{publicLink}:
 *   get:
 *     summary: Obter perfil público do usuário por link público
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: publicLink
 *         required: true
 *         schema:
 *           type: string
 *         description: Link público do usuário
 *     responses:
 *       200:
 *         description: Perfil público do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 publicTitle:
 *                   type: string
 *                 socialLinks:
 *                   type: object
 *       404:
 *         description: Link público não encontrado
 */
router.get('/public-profile/:publicLink', getPublicProfile);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Criar novo agendamento (público)
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - publicLink
 *               - slotId
 *               - clientName
 *               - clientEmail
 *               - clientPhone
 *             properties:
 *               publicLink:
 *                 type: string
 *                 example: 'a1b2c3d4e5f6g7h8'
 *               slotId:
 *                 type: string
 *                 example: 'slot123'
 *               clientName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: 'Maria Santos'
 *               clientEmail:
 *                 type: string
 *                 format: email
 *                 example: 'maria@exemplo.com'
 *               clientPhone:
 *                 type: string
 *                 pattern: '^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$'
 *                 example: '(11) 98765-4321'
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *                 example: 'Observações opcionais'
 *     responses:
 *       201:
 *         description: Agendamento criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *                 message:
 *                   type: string
 *       400:
 *         description: Erro de validação
 *       404:
 *         description: Link público ou horário não encontrado
 *       409:
 *         description: Horário não disponível ou totalmente reservado
 */
router.post('/', ...validateCreateBooking, createBookingHandler);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Obter agendamentos do usuário autenticado
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de agendamentos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Não autenticado
 */
router.get('/my-bookings', authenticate, getMyBookings);

export default router;

