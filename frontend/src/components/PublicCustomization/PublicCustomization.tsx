import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { labels } from '../../locales/pt-BR';
import { updatePublicCustomization, uploadProfileImage, uploadBannerImage, uploadBackgroundImage } from '../../services/api';
import type { SocialLinks, User, PublicProfile } from '../../types';
import Button from '../shared/Button/Button';
import Input from '../shared/Input/Input';
import ImageUpload from '../ImageUpload/ImageUpload';
import BannerPositionEditor from '../BannerPositionEditor/BannerPositionEditor';
import { useToast } from '../../hooks/useToast';
import './PublicCustomization.css';

interface PublicCustomizationProps {
  user: User | null;
  onUpdate?: () => void;
}

const PublicCustomization = ({ user, onUpdate }: PublicCustomizationProps) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [publicTitle, setPublicTitle] = useState('');
  const [publicProfile, setPublicProfile] = useState<PublicProfile>({
    description: '',
    mainUsername: '',
  });
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: '',
    facebook: '',
    twitter: '',
    telegram: '',
    whatsapp: '',
    tiktok: '',
    youtube: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBannerPositionEditor, setShowBannerPositionEditor] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setPublicTitle(user.settings.publicTitle || '');
      setPublicProfile({
        profileImageUrl: user.settings.publicProfile?.profileImageUrl,
        bannerImageUrl: user.settings.publicProfile?.bannerImageUrl,
        bannerPositionX: user.settings.publicProfile?.bannerPositionX ?? 50,
        bannerPositionY: user.settings.publicProfile?.bannerPositionY ?? 50,
        backgroundImageUrl: user.settings.publicProfile?.backgroundImageUrl,
        description: user.settings.publicProfile?.description || '',
        mainUsername: user.settings.publicProfile?.mainUsername || '',
      });
      setSocialLinks({
        instagram: user.settings.socialLinks?.instagram || '',
        facebook: user.settings.socialLinks?.facebook || '',
        twitter: user.settings.socialLinks?.twitter || '',
        telegram: user.settings.socialLinks?.telegram || '',
        whatsapp: user.settings.socialLinks?.whatsapp || '',
        tiktok: user.settings.socialLinks?.tiktok || '',
        youtube: user.settings.socialLinks?.youtube || '',
      });
    }
  }, [user]);

  // Função para formatar URL a partir de @username ou username
  const formatSocialUrl = (value: string, platform: keyof SocialLinks): string => {
    if (!value || !value.trim()) return value;
    
    const trimmed = value.trim();
    
    // Se já é uma URL completa, retornar como está
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // Remover @ se presente
    const username = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
    
    // Formatar URL baseada na plataforma
    switch (platform) {
      case 'instagram':
        return `https://instagram.com/${username}`;
      case 'facebook':
        return `https://facebook.com/${username}`;
      case 'twitter':
        return `https://twitter.com/${username}`;
      case 'telegram':
        // Telegram pode ser @username ou t.me/username
        if (username.startsWith('t.me/')) {
          return `https://${username}`;
        }
        return `https://t.me/${username}`;
      case 'whatsapp':
        // WhatsApp precisa ser número completo (ex: 5511999999999)
        // Se for apenas número, formatar como wa.me
        const numbers = username.replace(/\D/g, '');
        if (numbers) {
          return `https://wa.me/${numbers}`;
        }
        return trimmed; // Manter como está se não for número
      case 'tiktok':
        // TikTok pode ser @username ou tiktok.com/@username
        if (username.startsWith('tiktok.com/')) {
          return `https://${username}`;
        }
        return `https://tiktok.com/@${username}`;
      case 'youtube':
        // YouTube pode ser @username, youtube.com/@username ou youtube.com/channel/...
        if (username.startsWith('youtube.com/') || username.startsWith('youtu.be/')) {
          return `https://${username}`;
        }
        return `https://youtube.com/@${username}`;
      default:
        return trimmed;
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url || !url.trim()) return true; // URLs opcionais
    
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      new URL(normalizedUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    // Formatar automaticamente quando o usuário sair do campo (onBlur)
    // Mas não formatar enquanto está digitando para não interferir
    setSocialLinks(prev => ({
      ...prev,
      [platform]: value,
    }));

    // Limpar erro ao digitar
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[platform];
      return newErrors;
    });
  };

  const handleSocialLinkBlur = (platform: keyof SocialLinks, value: string) => {
    // Formatar automaticamente quando sair do campo
    if (value && value.trim()) {
      const formatted = formatSocialUrl(value, platform);
      setSocialLinks(prev => ({
        ...prev,
        [platform]: formatted,
      }));
      
      // Validar URL formatada
      if (!validateUrl(formatted)) {
        setErrors(prev => ({
          ...prev,
          [platform]: labels.errorInvalidUrl,
        }));
      }
    }
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'banner' | 'background') => {
    setUploadingImage(type);
    try {
      let response;
      if (type === 'profile') {
        response = await uploadProfileImage(file);
      } else if (type === 'banner') {
        response = await uploadBannerImage(file);
      } else {
        response = await uploadBackgroundImage(file);
      }

      const imageUrl = response.data.url;
      setPublicProfile(prev => ({
        ...prev,
        [`${type}ImageUrl`]: imageUrl,
      }));

      toast.success(`${type === 'profile' ? 'Foto de perfil' : type === 'banner' ? 'Banner' : 'Foto de fundo'} atualizada com sucesso!`);
      onUpdate?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setUploadingImage(null);
    }
  };

  const handleImageRemove = (type: 'profile' | 'banner' | 'background') => {
    setPublicProfile(prev => ({
      ...prev,
      [`${type}ImageUrl`]: undefined,
      // Resetar posição do banner se remover
      ...(type === 'banner' && {
        bannerPositionX: 50,
        bannerPositionY: 50,
      }),
    }));
  };

  const handleBannerPositionSave = async (positionX: number, positionY: number) => {
    // Atualizar estado local primeiro
    setPublicProfile(prev => ({
      ...prev,
      bannerPositionX: positionX,
      bannerPositionY: positionY,
    }));

    // Salvar automaticamente no backend
    try {
      await updatePublicCustomization({
        publicProfile: {
          bannerPositionX: positionX,
          bannerPositionY: positionY,
        },
      });
      toast.success('Posição do banner salva com sucesso!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validar título
    if (publicTitle && publicTitle.length > 100) {
      setErrors({ publicTitle: 'Título deve ter no máximo 100 caracteres' });
      return;
    }

    // Validar descrição
    if (publicProfile.description && publicProfile.description.length > 500) {
      setErrors({ description: 'Descrição deve ter no máximo 500 caracteres' });
      return;
    }

    // Validar URLs
    const urlErrors: Record<string, string> = {};
    (Object.keys(socialLinks) as Array<keyof SocialLinks>).forEach(platform => {
      const value = socialLinks[platform];
      // Validar apenas URLs (não usernames)
      if (platform === 'instagram' || platform === 'facebook' || platform === 'twitter' || 
          platform === 'telegram' || platform === 'whatsapp' || platform === 'tiktok' || platform === 'youtube') {
        if (value && !validateUrl(value)) {
          urlErrors[platform] = labels.errorInvalidUrl;
        }
      }
    });

    if (Object.keys(urlErrors).length > 0) {
      setErrors(urlErrors);
      return;
    }

    setLoading(true);

    try {
      // Filtrar apenas links preenchidos e formatar antes de enviar
      const filledSocialLinks: Partial<SocialLinks> = {};
      (Object.keys(socialLinks) as Array<keyof SocialLinks>).forEach(platform => {
        const value = socialLinks[platform]?.trim();
        if (value) {
          // Formatar URLs das redes sociais
          if (platform === 'instagram' || platform === 'facebook' || platform === 'twitter' || 
              platform === 'telegram' || platform === 'whatsapp' || platform === 'tiktok' || platform === 'youtube') {
            filledSocialLinks[platform] = formatSocialUrl(value, platform);
          }
        }
      });

      await updatePublicCustomization({
        publicTitle: publicTitle.trim() || undefined,
        socialLinks: Object.keys(filledSocialLinks).length > 0 ? filledSocialLinks : undefined,
        publicProfile: {
          description: publicProfile.description?.trim() || undefined,
          mainUsername: publicProfile.mainUsername?.trim() || undefined,
          // URLs de imagens já foram atualizadas via upload separado
          profileImageUrl: publicProfile.profileImageUrl,
          bannerImageUrl: publicProfile.bannerImageUrl,
          bannerPositionX: publicProfile.bannerPositionX,
          bannerPositionY: publicProfile.bannerPositionY,
          backgroundImageUrl: publicProfile.backgroundImageUrl,
        },
      });

      toast.success(labels.customizationSaved);
      onUpdate?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="public-customization-form">
      <Input
        label={labels.publicTitle}
        placeholder={labels.publicTitlePlaceholder}
        value={publicTitle}
        onChange={(e) => setPublicTitle(e.target.value)}
        helpText={labels.publicTitleHelp}
        maxLength={100}
        error={errors.publicTitle}
      />

      <div className="images-section">
        <h5>Imagens do Perfil</h5>
        <p className="text-muted small">Adicione imagens para personalizar seu perfil público</p>

        <ImageUpload
          label="Foto de Perfil"
          currentImageUrl={publicProfile.profileImageUrl}
          onImageSelect={(file) => handleImageUpload(file, 'profile')}
          onImageRemove={() => handleImageRemove('profile')}
          helpText="Foto circular que aparece sobre o banner"
        />

        <ImageUpload
          label="Banner"
          currentImageUrl={publicProfile.bannerImageUrl}
          onImageSelect={(file) => handleImageUpload(file, 'banner')}
          onImageRemove={() => handleImageRemove('banner')}
          helpText="Imagem que aparece no topo do perfil"
          showPositionEditor={!!publicProfile.bannerImageUrl}
          onPositionEditorOpen={() => setShowBannerPositionEditor(true)}
          positionX={publicProfile.bannerPositionX ?? 50}
          positionY={publicProfile.bannerPositionY ?? 50}
        />

        <ImageUpload
          label="Foto de Fundo"
          currentImageUrl={publicProfile.backgroundImageUrl}
          onImageSelect={(file) => handleImageUpload(file, 'background')}
          onImageRemove={() => handleImageRemove('background')}
          helpText="Imagem de fundo abaixo do header"
        />
      </div>

      <Input
        label={labels.mainUsername || '@ Principal'}
        placeholder="@usuario"
        value={publicProfile.mainUsername}
        onChange={(e) => {
          let value = e.target.value;
          if (value.startsWith('@')) {
            value = value.slice(1);
          }
          setPublicProfile(prev => ({ ...prev, mainUsername: value }));
        }}
        helpText="Seu @ principal que aparece no perfil"
        maxLength={30}
        error={errors.mainUsername}
      />

      <Input
        as="textarea"
        rows={4}
        label={labels.description || 'Descrição/Bio'}
        placeholder="Escreva uma descrição sobre você..."
        value={publicProfile.description}
        onChange={(e) => setPublicProfile(prev => ({ ...prev, description: e.target.value }))}
        helpText={`${publicProfile.description?.length || 0}/500 caracteres`}
        maxLength={500}
        error={errors.description}
      />

      <div className="social-links-section">
        <h5>{labels.socialLinks}</h5>
        <p className="text-muted small">{labels.socialLinksHelp}</p>

        <Input
          label={labels.instagram}
          placeholder="@usuario ou instagram.com/usuario"
          value={socialLinks.instagram}
          onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
          onBlur={(e) => handleSocialLinkBlur('instagram', e.target.value)}
          error={errors.instagram}
        />

        <Input
          label={labels.facebook}
          placeholder="@usuario ou facebook.com/usuario"
          value={socialLinks.facebook}
          onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
          onBlur={(e) => handleSocialLinkBlur('facebook', e.target.value)}
          error={errors.facebook}
        />

        <Input
          label={labels.twitter}
          placeholder="@usuario ou twitter.com/usuario"
          value={socialLinks.twitter}
          onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
          onBlur={(e) => handleSocialLinkBlur('twitter', e.target.value)}
          error={errors.twitter}
        />

        <Input
          label={labels.telegram}
          placeholder="@usuario ou t.me/usuario"
          value={socialLinks.telegram}
          onChange={(e) => handleSocialLinkChange('telegram', e.target.value)}
          onBlur={(e) => handleSocialLinkBlur('telegram', e.target.value)}
          error={errors.telegram}
        />

        <Input
          label={labels.whatsapp}
          placeholder="5511999999999 ou wa.me/5511999999999"
          value={socialLinks.whatsapp}
          onChange={(e) => handleSocialLinkChange('whatsapp', e.target.value)}
          onBlur={(e) => handleSocialLinkBlur('whatsapp', e.target.value)}
          error={errors.whatsapp}
        />

        <Input
          label={labels.tiktok}
          placeholder="@usuario ou tiktok.com/@usuario"
          value={socialLinks.tiktok}
          onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
          onBlur={(e) => handleSocialLinkBlur('tiktok', e.target.value)}
          error={errors.tiktok}
        />

        <Input
          label={labels.youtube}
          placeholder="@usuario ou youtube.com/@usuario"
          value={socialLinks.youtube}
          onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
          onBlur={(e) => handleSocialLinkBlur('youtube', e.target.value)}
          error={errors.youtube}
        />

      </div>

      <Button type="submit" disabled={loading || uploadingImage !== null}>
        {loading || uploadingImage ? labels.loading : labels.saveCustomization}
      </Button>

      {/* Modal de Ajuste de Posição do Banner */}
      {publicProfile.bannerImageUrl && (
        <BannerPositionEditor
          imageUrl={publicProfile.bannerImageUrl}
          currentPositionX={publicProfile.bannerPositionX ?? 50}
          currentPositionY={publicProfile.bannerPositionY ?? 50}
          onSave={handleBannerPositionSave}
          onClose={() => setShowBannerPositionEditor(false)}
          show={showBannerPositionEditor}
        />
      )}
    </Form>
  );
};

export default PublicCustomization;

