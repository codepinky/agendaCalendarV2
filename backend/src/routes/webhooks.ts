import { Router } from 'express';
import { kiwifyWebhook } from '../controllers/webhooksController';
import { webhookLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @swagger
 * /api/webhooks/kiwify:
 *   post:
 *     summary: Webhook da Kiwify para criação de licenses
 *     tags: [Webhooks]
 *     description: |
 *       Endpoint para receber webhooks da Kiwify quando uma compra é aprovada.
 *       Requer header `x-webhook-secret` para autenticação.
 *       Valida assinatura HMAC SHA256 se `KIWIFY_WEBHOOK_SECRET` estiver configurado.
 *     security:
 *       - webhookSecret: []
 *     parameters:
 *       - in: query
 *         name: signature
 *         schema:
 *           type: string
 *         description: Assinatura HMAC SHA256 do payload (opcional se secret não configurado)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order_id:
 *                 type: string
 *               order_status:
 *                 type: string
 *                 enum: [paid, approved, pending, cancelled]
 *               webhook_event_type:
 *                 type: string
 *                 enum: [order_approved, order_refunded]
 *               Customer:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *     responses:
 *       200:
 *         description: Webhook processado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                 issued:
 *                   type: boolean
 *                 licenseCode:
 *                   type: string
 *                   example: 'LIC-A1B2C3D4E5F6'
 *                 alreadyExisted:
 *                   type: boolean
 *       401:
 *         description: Autenticação falhou (header x-webhook-secret inválido ou assinatura inválida)
 *       400:
 *         description: Dados inválidos (order_id ou Customer.email faltando)
 */
router.post('/kiwify', webhookLimiter, kiwifyWebhook);

export default router;


