import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  updatePublicCustomizationHandler,
  uploadProfileImageHandler,
  uploadBannerImageHandler,
  uploadBackgroundImageHandler
} from '../controllers/userController';
import { uploadSingle } from '../middleware/upload';
import { logger } from '../utils/logger';

const router = Router();

/**
 * @swagger
 * /api/users/public-customization:
 *   put:
 *     summary: Atualizar customizações do link público
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publicTitle:
 *                 type: string
 *                 maxLength: 100
 *                 example: 'Dr. João Silva - Agendamento'
 *               socialLinks:
 *                 type: object
 *                 properties:
 *                   instagram:
 *                     type: string
 *                     example: 'https://instagram.com/usuario'
 *                   facebook:
 *                     type: string
 *                     example: 'https://facebook.com/usuario'
 *                   twitter:
 *                     type: string
 *                     example: 'https://twitter.com/usuario'
 *                   telegram:
 *                     type: string
 *                     example: 'https://t.me/usuario'
 *                   whatsapp:
 *                     type: string
 *                     example: 'https://wa.me/5511999999999'
 *                   tiktok:
 *                     type: string
 *                     example: 'https://tiktok.com/@usuario'
 *                   youtube:
 *                     type: string
 *                     example: 'https://youtube.com/@usuario'
 *     responses:
 *       200:
 *         description: Customizações atualizadas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 */
router.put('/public-customization', authenticate, updatePublicCustomizationHandler);

/**
 * @swagger
 * /api/users/upload/profile-image:
 *   post:
 *     summary: Fazer upload de foto de perfil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 */
router.post('/upload/profile-image', 
  (req, res, next) => {
    logger.info('Profile image upload route hit', {
      method: req.method,
      path: req.path,
      hasAuth: !!req.headers.authorization,
      contentType: req.headers['content-type'],
      ip: req.ip,
    });
    next();
  },
  authenticate, 
  (req, res, next) => {
    logger.info('After authentication, before multer', {
      userId: (req as any).user?.uid,
      hasFile: !!req.file,
    });
    uploadSingle('image')(req, res, (err: any) => {
      if (err) {
        logger.error('Multer error in profile image upload', {
          error: err.message,
          stack: err.stack,
          userId: (req as any).user?.uid,
        });
        return res.status(400).json({
          error: err.message || 'Erro ao processar o arquivo',
          details: 'Verifique se o arquivo é uma imagem válida (JPG, PNG ou WEBP) e não excede 5MB',
        });
      }
      logger.info('Multer success, file received', {
        userId: (req as any).user?.uid,
        fileSize: req.file?.size,
        fileMimetype: req.file?.mimetype,
      });
      next();
    });
  }, 
  uploadProfileImageHandler
);

/**
 * @swagger
 * /api/users/upload/banner-image:
 *   post:
 *     summary: Fazer upload de banner
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 */
router.post('/upload/banner-image', authenticate, uploadSingle('image'), uploadBannerImageHandler);

/**
 * @swagger
 * /api/users/upload/background-image:
 *   post:
 *     summary: Fazer upload de foto de fundo
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: Não autenticado
 */
router.post('/upload/background-image', authenticate, uploadSingle('image'), uploadBackgroundImageHandler);

export default router;

