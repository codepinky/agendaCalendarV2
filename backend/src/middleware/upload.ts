import multer from 'multer';
import { Request } from 'express';

// Configurar multer para armazenar em memória (buffer)
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG ou WEBP.'));
  }
};

// Configuração do multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Middleware para upload de uma única imagem
export const uploadSingle = (fieldName: string) => {
  return upload.single(fieldName);
};







