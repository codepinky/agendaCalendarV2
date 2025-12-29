import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createSlotHandler, getSlotsHandler, deleteSlotHandler } from '../controllers/slotsController';
import { validateCreateSlot } from '../middleware/validation';

const router = Router();

// All slots routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/slots:
 *   post:
 *     summary: Criar novo horário disponível
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 pattern: '^\d{4}-\d{2}-\d{2}$'
 *                 example: '2025-12-20'
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: '14:30'
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
 *                 example: '15:30'
 *               bufferMinutes:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1440
 *                 default: 0
 *                 example: 30
 *     responses:
 *       201:
 *         description: Horário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailableSlot'
 *       400:
 *         description: Erro de validação
 *       409:
 *         description: Conflito de horário (sobreposição ou violação de buffer)
 *       401:
 *         description: Não autenticado
 */
router.post('/', ...validateCreateSlot, createSlotHandler);

/**
 * @swagger
 * /api/slots:
 *   get:
 *     summary: Listar horários do usuário
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includePast
 *         required: false
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Se true, inclui slots passados (histórico). Se false ou omitido, retorna apenas slots futuros.
 *     responses:
 *       200:
 *         description: Lista de horários
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AvailableSlot'
 *       401:
 *         description: Não autenticado
 */
router.get('/', getSlotsHandler);

/**
 * @swagger
 * /api/slots/{id}:
 *   delete:
 *     summary: Deletar horário
 *     tags: [Slots]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do horário
 *     responses:
 *       200:
 *         description: Horário deletado com sucesso
 *       404:
 *         description: Horário não encontrado
 *       400:
 *         description: Não é possível deletar (tem agendamentos)
 *       401:
 *         description: Não autenticado
 */
router.delete('/:id', deleteSlotHandler);

export default router;

