import { storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export type ImageType = 'profile' | 'banner' | 'background';

interface UploadResult {
  url: string;
  path: string;
}

/**
 * Valida se o arquivo é uma imagem válida
 */
const validateImage = (file: Express.Multer.File): void => {
  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.');
  }

  // Validar extensão
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Extensão de arquivo não permitida. Use .jpg, .png ou .webp.');
  }

  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
};

/**
 * Deleta uma imagem antiga do Storage
 */
export const deleteImage = async (url: string): Promise<void> => {
  try {
    if (!url) return;

    // Extrair o path da URL
    // Formato: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
    
    if (!pathMatch) {
      logger.warn('Could not extract path from URL for deletion', { url });
      return;
    }

    const filePath = decodeURIComponent(pathMatch[1]);
    
    // Obter bucket do Firebase
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      logger.warn('FIREBASE_PROJECT_ID not set, cannot delete image', { url });
      return;
    }
    
    const bucketName = `${projectId}.firebasestorage.app`;
    const bucket = storage.bucket(bucketName);
    if (!bucket) {
      logger.warn('Firebase Storage bucket not available, cannot delete image', { 
        bucketName,
        url 
      });
      return;
    }
    
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      logger.info('Image deleted from storage', { filePath });
    }
  } catch (error: any) {
    logger.error('Error deleting image from storage', {
      error: error.message,
      url,
    });
    // Não lançar erro - se falhar ao deletar, não é crítico
  }
};

/**
 * Faz upload de uma imagem para o Firebase Storage
 * Retorna URL pública permanente com token
 */
export const uploadImage = async (
  userId: string,
  file: Express.Multer.File,
  type: ImageType
): Promise<UploadResult> => {
  logger.info('Starting image upload', {
    userId,
    type,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    hasBuffer: !!file.buffer,
    bufferLength: file.buffer?.length,
  });

  // Validar arquivo
  validateImage(file);

  // Gerar nome único
  const timestamp = Date.now();
  const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0] || '.jpg';
  const fileName = `${timestamp}${ext}`;
  const filePath = `users/${userId}/${type}/${fileName}`;

  // Gerar token único para download público
  const downloadToken = uuidv4();

  // Verificar se o Firebase Storage está inicializado
  if (!storage) {
    logger.error('Firebase Storage not initialized', { userId, type });
    throw new Error('Firebase Storage não está inicializado. Verifique as variáveis de ambiente FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY e FIREBASE_CLIENT_EMAIL.');
  }

  // Obter bucket do Firebase
  // Mesmo com storageBucket na inicialização, precisamos passar explicitamente
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    logger.error('FIREBASE_PROJECT_ID not set', { userId, type });
    throw new Error('FIREBASE_PROJECT_ID não está configurado nas variáveis de ambiente.');
  }

  const bucketName = `${projectId}.firebasestorage.app`;
  const bucket = storage.bucket(bucketName);
  
  if (!bucket) {
    logger.error('Firebase Storage bucket not available', { 
      bucketName,
      userId, 
      type 
    });
    throw new Error(`Firebase Storage bucket não está disponível: ${bucketName}`);
  }

  logger.info('Using Firebase Storage bucket', {
    bucketName: bucket.name,
    userId,
    type,
  });

  // Criar referência do arquivo
  const fileRef = bucket.file(filePath);

  // Upload do arquivo
  try {
    // Fazer upload do arquivo com metadados incluindo o token de download
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          type: type,
        },
      },
    });

    // Verificar se o token foi configurado corretamente
    const [metadata] = await fileRef.getMetadata();
    if (!metadata.metadata?.firebaseStorageDownloadTokens) {
      // Se o token não foi configurado, atualizar os metadados
      await fileRef.setMetadata({
        metadata: {
          ...metadata.metadata,
          firebaseStorageDownloadTokens: downloadToken,
        },
      });
      logger.info('Download token set after upload', { filePath, userId, type });
    }
  } catch (uploadError: any) {
    logger.error('Error saving file to Firebase Storage', {
      error: uploadError.message,
      stack: uploadError.stack,
      filePath,
      userId,
      type,
      errorCode: uploadError.code,
      errorDetails: uploadError.details,
    });
    
    // Se o erro for relacionado a credenciais ou configuração
    if (uploadError.code === 403 || uploadError.code === 401) {
      throw new Error('Erro de autenticação com Firebase Storage. Verifique as credenciais do Firebase.');
    }
    
    if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
      throw new Error('Firebase Storage bucket não encontrado. Verifique se o Storage está habilitado no projeto Firebase.');
    }
    
    throw new Error(`Erro ao fazer upload para Firebase Storage: ${uploadError.message}`);
  }

  // Construir URL pública permanente
  // Formato: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?alt=media&token={token}
  const encodedPath = encodeURIComponent(filePath);
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

  logger.info('Image uploaded to storage successfully', {
    userId,
    type,
    filePath,
    bucketName: bucket.name,
    size: file.size,
    url: publicUrl,
  });

  return {
    url: publicUrl,
    path: filePath,
  };
};


