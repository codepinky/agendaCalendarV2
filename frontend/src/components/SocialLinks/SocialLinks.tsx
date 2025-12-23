import { FaInstagram, FaFacebook, FaTelegram, FaWhatsapp, FaTiktok, FaYoutube } from 'react-icons/fa6';
import { FaTwitter } from 'react-icons/fa';
import type { SocialLinks as SocialLinksType } from '../../types';
import './SocialLinks.css';

interface SocialLinksProps {
  socialLinks: SocialLinksType;
}

const SocialLinks = ({ socialLinks }: SocialLinksProps) => {
  const links = [
    { key: 'instagram' as const, icon: FaInstagram, color: '#E4405F', label: 'Instagram', bgColor: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' },
    { key: 'facebook' as const, icon: FaFacebook, color: '#1877F2', label: 'Facebook', bgColor: '#1877F2' },
    { key: 'twitter' as const, icon: FaTwitter, color: '#000000', label: 'Twitter/X', bgColor: '#000000' },
    { key: 'telegram' as const, icon: FaTelegram, color: '#0088cc', label: 'Telegram', bgColor: '#0088cc' },
    { key: 'whatsapp' as const, icon: FaWhatsapp, color: '#25D366', label: 'WhatsApp', bgColor: '#25D366' },
    { key: 'tiktok' as const, icon: FaTiktok, color: '#000000', label: 'TikTok', bgColor: '#000000' },
    { key: 'youtube' as const, icon: FaYoutube, color: '#FF0000', label: 'YouTube', bgColor: '#FF0000' },
  ];

  // Filtrar links que têm URL
  const activeLinks = links.filter(link => {
    const url = socialLinks[link.key];
    return url && url.trim();
  });

  if (activeLinks.length === 0) {
    return null;
  }

  return (
    <div className="social-links-list">
      {activeLinks.map(({ key, icon: Icon, label }) => {
        const url = socialLinks[key];
        
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-link-icon-button"
            title={label}
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
};

export default SocialLinks;

