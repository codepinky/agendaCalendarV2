import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { updatePublicCustomization } from '../services/userService';
import { uploadImage, deleteImage } from '../services/storageService';
import { logger } from '../utils/logger';
import { db } from '../services/firebase';

export const updatePublicCustomizationHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para atualizar as customizações'
      });
    }

    const { publicTitle, socialLinks, publicProfile } = req.body;

    // Validar que pelo menos um campo foi fornecido
    if (publicTitle === undefined && socialLinks === undefined && publicProfile === undefined) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: 'É necessário fornecer pelo menos um campo para atualizar'
      });
    }

    await updatePublicCustomization(req.user.uid, {
      publicTitle,
      socialLinks,
      publicProfile,
    });

    logger.info('Public customization updated successfully', {
      userId: req.user.uid,
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: 'Customizações atualizadas com sucesso',
    });
  } catch (error: any) {
    logger.error('Error updating public customization', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
    });

    if (error.message.includes('Título') || error.message.includes('URL inválida')) {
      return res.status(400).json({
        error: error.message,
        details: error.message,
      });
    }

    if (error.message === 'Usuário não encontrado') {
      return res.status(404).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao atualizar as customizações. Tente novamente mais tarde.',
    });
  }
};

export const uploadProfileImageHandler = async (req: AuthRequest, res: Response) => {
  logger.info('Profile image upload request received', {
    userId: req.user?.uid,
    hasFile: !!req.file,
    fileSize: req.file?.size,
    fileMimetype: req.file?.mimetype,
    ip: req.ip,
  });

  try {
    if (!req.user) {
      logger.warn('Unauthorized profile image upload attempt', { ip: req.ip });
      return res.status(401).json({ 
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para fazer upload de imagens'
      });
    }

    if (!req.file) {
      logger.warn('Profile image upload without file', { userId: req.user.uid, ip: req.ip });
      return res.status(400).json({
        error: 'Arquivo não fornecido',
        details: 'É necessário enviar uma imagem'
      });
    }

    const userId = req.user.uid;

    // Buscar URL antiga para deletar
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const oldUrl = userData?.settings?.publicProfile?.profileImageUrl;

    // Fazer upload da nova imagem
    const result = await uploadImage(userId, req.file, 'profile');

    // Deletar imagem antiga (se existir)
    if (oldUrl) {
      await deleteImage(oldUrl);
    }

    // Atualizar no Firestore
    const currentSettings = userData?.settings || {};
    const currentPublicProfile = currentSettings.publicProfile || {};
    
    await db.collection('users').doc(userId).update({
      'settings.publicProfile': {
        ...currentPublicProfile,
        profileImageUrl: result.url,
      },
    });

    logger.info('Profile image uploaded successfully', {
      userId,
      url: result.url,
      ip: req.ip,
    });

    return res.json({
      success: true,
      url: result.url,
      message: 'Foto de perfil atualizada com sucesso',
    });
  } catch (error: any) {
    logger.error('Error uploading profile image', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
      errorName: error.name,
    });

    if (error.message.includes('Tipo de arquivo') || error.message.includes('tamanho')) {
      return res.status(400).json({
        error: error.message,
        details: error.message,
      });
    }

    // Retornar erro detalhado para facilitar debug
    // Em produção, ainda mostrar mensagem genérica mas logar detalhes
    logger.error('Upload error details', {
      errorMessage: error.message,
      errorName: error.name,
      errorCode: error.code,
      userId: req.user?.uid,
    });
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message || 'Ocorreu um erro ao fazer upload da imagem. Tente novamente mais tarde.',
    });
  }
};

export const uploadBannerImageHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para fazer upload de imagens'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Arquivo não fornecido',
        details: 'É necessário enviar uma imagem'
      });
    }

    const userId = req.user.uid;

    // Buscar URL antiga para deletar
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const oldUrl = userData?.settings?.publicProfile?.bannerImageUrl;

    // Fazer upload da nova imagem
    const result = await uploadImage(userId, req.file, 'banner');

    // Deletar imagem antiga (se existir)
    if (oldUrl) {
      await deleteImage(oldUrl);
    }

    // Atualizar no Firestore
    const currentSettings = userData?.settings || {};
    const currentPublicProfile = currentSettings.publicProfile || {};
    
    await db.collection('users').doc(userId).update({
      'settings.publicProfile': {
        ...currentPublicProfile,
        bannerImageUrl: result.url,
      },
    });

    logger.info('Banner image uploaded successfully', {
      userId,
      url: result.url,
      ip: req.ip,
    });

    return res.json({
      success: true,
      url: result.url,
      message: 'Banner atualizado com sucesso',
    });
  } catch (error: any) {
    logger.error('Error uploading banner image', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
    });

    if (error.message.includes('Tipo de arquivo') || error.message.includes('tamanho')) {
      return res.status(400).json({
        error: error.message,
        details: error.message,
      });
    }

    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao fazer upload da imagem. Tente novamente mais tarde.',
    });
  }
};

export const uploadBackgroundImageHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autorizado',
        details: 'Você precisa estar autenticado para fazer upload de imagens'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Arquivo não fornecido',
        details: 'É necessário enviar uma imagem'
      });
    }

    const userId = req.user.uid;

    // Buscar URL antiga para deletar
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const oldUrl = userData?.settings?.publicProfile?.backgroundImageUrl;

    // Fazer upload da nova imagem
    const result = await uploadImage(userId, req.file, 'background');

    // Deletar imagem antiga (se existir)
    if (oldUrl) {
      await deleteImage(oldUrl);
    }

    // Atualizar no Firestore
    const currentSettings = userData?.settings || {};
    const currentPublicProfile = currentSettings.publicProfile || {};
    
    await db.collection('users').doc(userId).update({
      'settings.publicProfile': {
        ...currentPublicProfile,
        backgroundImageUrl: result.url,
      },
    });

    logger.info('Background image uploaded successfully', {
      userId,
      url: result.url,
      ip: req.ip,
    });

    return res.json({
      success: true,
      url: result.url,
      message: 'Foto de fundo atualizada com sucesso',
    });
  } catch (error: any) {
    logger.error('Error uploading background image', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.uid,
      ip: req.ip,
    });

    if (error.message.includes('Tipo de arquivo') || error.message.includes('tamanho')) {
      return res.status(400).json({
        error: error.message,
        details: error.message,
      });
    }

    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: 'Ocorreu um erro ao fazer upload da imagem. Tente novamente mais tarde.',
    });
  }
};

