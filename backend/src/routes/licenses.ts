import { Router } from 'express';
import { validateLicense } from '../controllers/licensesController';
import { licenseValidationLimiter } from '../middleware/rateLimit';
import { validateLicenseCode } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/licenses/validate:
 *   post:
 *     summary: Validar código de licença
 *     tags: [Licenses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 50
 *                 example: 'LIC-A1B2C3D4E5F6'
 *     responses:
 *       200:
 *         description: Resultado da validação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                   type: string
 *                   format: email
 *                   example: 'comprador@exemplo.com'
 *                 license:
 *                   $ref: '#/components/schemas/License'
 *       400:
 *         description: License inválida, inativa ou já utilizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *       404:
 *         description: License não encontrada
 *       429:
 *         description: Muitas tentativas (rate limit)
 */
router.post('/validate', licenseValidationLimiter, ...validateLicenseCode, validateLicense);

export default router;

