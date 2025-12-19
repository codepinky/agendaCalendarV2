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
 *         description: ✅ Usuário registrado com sucesso (apenas se license for válida e não usada)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   description: Token Firebase para autenticação
 *             example:
 *               success: true
 *               user:
 *                 id: "abc123"
 *                 email: "usuario@exemplo.com"
 *                 name: "João Silva"
 *                 publicLink: "a1b2c3d4e5f6g7h8"
 *               token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: ❌ Erro de validação, license inativa, já utilizada ou email já registrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               licenseInactive:
 *                 value:
 *                   error: "Código de licença não está ativo"
 *                   details: "Esta licença não pode ser usada no momento"
 *               licenseUsed:
 *                 value:
 *                   error: "Código de licença já foi utilizado"
 *                   details: "Cada código de licença só pode ser usado uma vez. Se você já possui uma conta, faça login."
 *               emailExists:
 *                 value:
 *                   error: "Email já registrado"
 *                   details: "Este email já está em uso. Por favor, faça login."
 *               validationError:
 *                 value:
 *                   error: "Dados inválidos"
 *                   details: "Verifique os dados enviados"
 *       404:
 *         description: ❌ License não encontrada (código não existe no banco)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Código de licença não encontrado"
 *               details: "Verifique se o código foi digitado corretamente"
 *       429:
 *         description: ⚠️ Muitas tentativas (rate limit - máximo 5 tentativas por hora)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Too many requests, please try again later."
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

