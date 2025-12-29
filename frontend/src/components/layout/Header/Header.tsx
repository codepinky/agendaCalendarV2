import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../../services/firebase';
import { FaBars, FaChevronDown, FaSignOutAlt, FaCog } from 'react-icons/fa';
import type { User } from '../../../types';
import './Header.css';

interface HeaderProps {
  user: User | null;
  onToggleSidebar: () => void;
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/horarios/abrir': 'Abrir Horários',
  '/dashboard/horarios': 'Ver Horários',
  '/dashboard/agendamentos/hoje': 'Agendamentos do Dia',
  '/dashboard/agendamentos': 'Todos Agendamentos',
  '/dashboard/link-publico': 'Link Público',
  '/dashboard/personalizacao': 'Personalização',
  '/dashboard/google-calendar': 'Google Calendar',
  '/dashboard/configuracoes': 'Configurações',
};

function Header({ user, onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPath = location.pathname;
  const currentLabel = routeLabels[currentPath] || 'Dashboard';
  const breadcrumbs = ['Dashboard', currentLabel !== 'Dashboard' ? currentLabel : null].filter(Boolean);

  const getUserInitials = () => {
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserPhoto = () => {
    return user?.settings?.publicProfile?.profileImageUrl;
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const handleSettings = () => {
    navigate('/dashboard/configuracoes');
    setDropdownOpen(false);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-left">
        <button
          className="dashboard-header-toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FaBars />
        </button>
        <nav className="dashboard-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <span key={index} className="dashboard-breadcrumb">
              {index > 0 && <span className="dashboard-breadcrumb-separator">/</span>}
              <span className={index === breadcrumbs.length - 1 ? 'dashboard-breadcrumb-current' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="dashboard-header-right">
        <div className="dashboard-header-profile" ref={dropdownRef}>
          <button
            className="dashboard-header-profile-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="User menu"
          >
            {getUserPhoto() ? (
              <img
                src={getUserPhoto()}
                alt={user?.name || 'User'}
                className="dashboard-header-profile-photo"
              />
            ) : (
              <div className="dashboard-header-profile-initials">
                {getUserInitials()}
              </div>
            )}
            <span className="dashboard-header-profile-name">{user?.name || 'Usuário'}</span>
            <FaChevronDown className={`dashboard-header-profile-chevron ${dropdownOpen ? 'open' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="dashboard-header-dropdown">
              <div className="dashboard-header-dropdown-header">
                {getUserPhoto() ? (
                  <img
                    src={getUserPhoto()}
                    alt={user?.name || 'User'}
                    className="dashboard-header-dropdown-photo"
                  />
                ) : (
                  <div className="dashboard-header-dropdown-initials">
                    {getUserInitials()}
                  </div>
                )}
                <div className="dashboard-header-dropdown-info">
                  <div className="dashboard-header-dropdown-name">{user?.name || 'Usuário'}</div>
                  <div className="dashboard-header-dropdown-email">{user?.email || ''}</div>
                </div>
              </div>
              <div className="dashboard-header-dropdown-divider" />
              <button
                className="dashboard-header-dropdown-item"
                onClick={handleSettings}
              >
                <FaCog className="dashboard-header-dropdown-icon" />
                Configurações
              </button>
              <button
                className="dashboard-header-dropdown-item"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="dashboard-header-dropdown-icon" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;



