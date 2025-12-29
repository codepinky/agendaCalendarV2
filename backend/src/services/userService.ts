import { db } from './firebase';
import { UserSettings, SocialLinks, PublicProfile } from '../types';
import { sanitizeString } from '../utils/validation';
import { logger } from '../utils/logger';
import { clearCache } from './cacheService';

// Domínios permitidos por rede social (apenas para campos de URL)
const ALLOWED_DOMAINS: Record<string, string[]> = {
  instagram: ['instagram.com', 'www.instagram.com'],
  facebook: ['facebook.com', 'www.facebook.com', 'fb.com', 'www.fb.com'],
  twitter: ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'],
  telegram: ['t.me', 'telegram.org', 'www.telegram.org'],
  whatsapp: ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
};

const validateSocialUrl = (url: string, platform: string): boolean => {
  if (!url) return true; // URLs opcionais
  
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();
    
    const allowedDomains = ALLOWED_DOMAINS[platform];
    if (!allowedDomains) return false;
    
    return allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

const sanitizeSocialLinks = (socialLinks: Partial<SocialLinks>): SocialLinks => {
  const sanitized: SocialLinks = {};
  
  (Object.keys(socialLinks) as Array<keyof SocialLinks>).forEach(key => {
    const value = socialLinks[key];
    if (value && value.trim()) {
      // Normalizar URLs das redes sociais
      if (key === 'instagram' || key === 'facebook' || key === 'twitter' || 
          key === 'telegram' || key === 'whatsapp' || key === 'tiktok' || key === 'youtube') {
        let normalizedUrl = value.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = `https://${normalizedUrl}`;
        }
        sanitized[key] = normalizedUrl;
      }
    }
  });
  
  return sanitized;
};

const validateUsername = (username: string): boolean => {
  if (!username) return true; // Opcional
  
  // Remover @ se presente
  const cleanUsername = username.startsWith('@') ? username.slice(1) : username;
  
  // Validar: apenas letras, números, underscore, ponto, máximo 30 caracteres
  return /^[a-zA-Z0-9._]+$/.test(cleanUsername) && cleanUsername.length <= 30;
};

export const updatePublicCustomization = async (
  userId: string,
  customizationData: { 
    publicTitle?: string; 
    socialLinks?: Partial<SocialLinks>;
    publicProfile?: Partial<PublicProfile>;
  }
): Promise<void> => {
  // Validar título
  if (customizationData.publicTitle !== undefined) {
    if (customizationData.publicTitle.length > 100) {
      throw new Error('Título deve ter no máximo 100 caracteres');
    }
    if (customizationData.publicTitle.trim().length === 0) {
      throw new Error('Título não pode estar vazio');
    }
  }

  // Validar descrição
  if (customizationData.publicProfile?.description !== undefined) {
    if (customizationData.publicProfile.description.length > 500) {
      throw new Error('Descrição deve ter no máximo 500 caracteres');
    }
  }

  // Validar @principal
  if (customizationData.publicProfile?.mainUsername !== undefined) {
    if (!validateUsername(customizationData.publicProfile.mainUsername)) {
      throw new Error('@principal inválido. Use apenas letras, números, underscore ou ponto (máx 30 caracteres)');
    }
  }

  // Validar e sanitizar links de redes sociais
  if (customizationData.socialLinks) {
    (Object.keys(customizationData.socialLinks) as Array<keyof SocialLinks>).forEach(key => {
      const value = customizationData.socialLinks![key];
      if (value && value.trim()) {
        // Validar URLs das redes sociais
        if (key === 'instagram' || key === 'facebook' || key === 'twitter' || 
            key === 'telegram' || key === 'whatsapp' || key === 'tiktok' || key === 'youtube') {
          if (!validateSocialUrl(value, key)) {
            throw new Error(`URL inválida para ${key}. Use um link válido da plataforma.`);
          }
        }
      }
    });
  }

  // Buscar usuário atual
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('Usuário não encontrado');
  }

  const userData = userDoc.data();
  const currentSettings: UserSettings = userData?.settings || {};

  // Atualizar settings
  const updatedSettings: UserSettings = {
    ...currentSettings,
  };

  if (customizationData.publicTitle !== undefined) {
    updatedSettings.publicTitle = sanitizeString(customizationData.publicTitle);
  }

  if (customizationData.socialLinks !== undefined) {
    updatedSettings.socialLinks = sanitizeSocialLinks(customizationData.socialLinks);
  }

  // Atualizar publicProfile
  if (customizationData.publicProfile !== undefined) {
    const currentPublicProfile = currentSettings.publicProfile || {};
    const updatedPublicProfile: PublicProfile = {
      ...currentPublicProfile,
    };

    if (customizationData.publicProfile.description !== undefined) {
      updatedPublicProfile.description = sanitizeString(customizationData.publicProfile.description);
    }

    if (customizationData.publicProfile.mainUsername !== undefined) {
      let username = customizationData.publicProfile.mainUsername.trim();
      if (username.startsWith('@')) {
        username = username.slice(1);
      }
      updatedPublicProfile.mainUsername = username || undefined;
    }

    // Manter URLs de imagens (não atualizar aqui, são atualizadas via upload)
    if (currentPublicProfile.profileImageUrl) {
      updatedPublicProfile.profileImageUrl = currentPublicProfile.profileImageUrl;
    }
    if (currentPublicProfile.bannerImageUrl) {
      updatedPublicProfile.bannerImageUrl = currentPublicProfile.bannerImageUrl;
    }
    if (currentPublicProfile.backgroundImageUrl) {
      updatedPublicProfile.backgroundImageUrl = currentPublicProfile.backgroundImageUrl;
    }
    
    // Atualizar posições do banner se fornecidas
    if (customizationData.publicProfile.bannerPositionX !== undefined) {
      updatedPublicProfile.bannerPositionX = Math.max(0, Math.min(100, customizationData.publicProfile.bannerPositionX));
    } else if (currentPublicProfile.bannerPositionX !== undefined) {
      updatedPublicProfile.bannerPositionX = currentPublicProfile.bannerPositionX;
    }
    if (customizationData.publicProfile.bannerPositionY !== undefined) {
      updatedPublicProfile.bannerPositionY = Math.max(0, Math.min(100, customizationData.publicProfile.bannerPositionY));
    } else if (currentPublicProfile.bannerPositionY !== undefined) {
      updatedPublicProfile.bannerPositionY = currentPublicProfile.bannerPositionY;
    }

    updatedSettings.publicProfile = updatedPublicProfile;
  }

  // Atualizar no Firestore
  // IMPORTANTE: Usar dot notation para atualizar settings.publicProfile para garantir merge correto
  // Isso evita que campos do publicProfile sejam perdidos quando atualizamos apenas alguns campos
  const updateData: any = {};
  
  if (customizationData.publicTitle !== undefined) {
    updateData['settings.publicTitle'] = updatedSettings.publicTitle;
  }
  
  if (customizationData.socialLinks !== undefined) {
    updateData['settings.socialLinks'] = updatedSettings.socialLinks;
  }
  
  if (customizationData.publicProfile !== undefined) {
    // Usar dot notation para atualizar apenas o publicProfile
    // Isso garante que o merge seja feito corretamente no Firestore
    updateData['settings.publicProfile'] = updatedSettings.publicProfile;
  }
  
  // Fazer update apenas se houver algo para atualizar
  if (Object.keys(updateData).length > 0) {
    await userRef.update(updateData);
  }

  // Limpar cache do usuário (para refletir mudanças no getCurrentUser)
  clearCache.user(userId);

  // Se o usuário tiver publicLink, também limpar cache de slots (caso o perfil público seja usado em algum lugar)
  const publicLink = userData?.publicLink;
  if (publicLink) {
    // Nota: Não há cache específico para perfil público, mas podemos limpar cache de slots
    // caso o perfil seja usado em algum lugar relacionado
  }

  logger.info('Public customization updated', {
    userId,
    hasPublicTitle: !!updatedSettings.publicTitle,
    socialLinksCount: Object.keys(updatedSettings.socialLinks || {}).length,
    hasPublicProfile: !!updatedSettings.publicProfile,
  });
};

