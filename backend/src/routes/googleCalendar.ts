import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { initiateAuth, handleCallback, disconnect } from '../controllers/googleCalendarController';

const router = Router();

/**
 * @swagger
 * /api/google-calendar/auth:
 *   get:
 *     summary: Iniciar autenticação com Google Calendar
 *     tags: [Google Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: URL de autenticação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authUrl:
 *                   type: string
 *                   format: uri
 *       401:
 *         description: Não autenticado
 */
router.get('/auth', authenticate, initiateAuth);

/**
 * @swagger
 * /api/google-calendar/callback:
 *   get:
 *     summary: Callback do OAuth do Google Calendar
 *     tags: [Google Calendar]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de autorização do Google
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: State (user ID) para validar requisição
 *     responses:
 *       302:
 *         description: Redireciona para dashboard com status
 *       400:
 *         description: Código ou state inválido
 */
router.get('/callback', handleCallback);

/**
 * @swagger
 * /api/google-calendar/disconnect:
 *   post:
 *     summary: Desconectar Google Calendar
 *     tags: [Google Calendar]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Desconectado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Não autenticado
 */
router.post('/disconnect', authenticate, disconnect);

export default router;

