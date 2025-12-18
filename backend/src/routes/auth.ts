import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { registerLimiter } from '../middleware/rateLimit';
import { validateRegister } from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - licenseCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@exemplo.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: senha123
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: João Silva
 *               licenseCode:
 *                 type: string
 *                 example: LIC-A1B2C3D4E5F6
 *     responses:
 *       200:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: Token Firebase para autenticação
 *       400:
 *         description: Erro de validação ou license inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: License não encontrada
 *       429:
 *         description: Muitas tentativas (rate limit)
 */
router.post('/register', registerLimiter, ...validateRegister, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login de usuário (deve ser feito via Firebase Auth no frontend)
 *     tags: [Auth]
 *     description: Este endpoint retorna 501. O login deve ser feito diretamente no frontend usando Firebase Auth.
 *     responses:
 *       501:
 *         description: Login deve ser feito via Firebase Auth no frontend
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter dados do usuário autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Não autenticado
 */
router.get('/me', authenticate, getCurrentUser);

export default router;

