import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaCalendarPlus, 
  FaCalendarAlt, 
  FaClock, 
  FaList, 
  FaLink, 
  FaPalette, 
  FaGoogle, 
  FaCog 
} from 'react-icons/fa';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType;
  section?: string;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: FaHome, section: 'DASHBOARD' },
  { path: '/dashboard/horarios/abrir', label: 'Abrir Horários', icon: FaCalendarPlus, section: 'DASHBOARD' },
  { path: '/dashboard/horarios', label: 'Ver Horários', icon: FaCalendarAlt, section: 'DASHBOARD' },
  { path: '/dashboard/agendamentos/hoje', label: 'Agendamentos do Dia', icon: FaClock, section: 'AGENDAMENTOS' },
  { path: '/dashboard/agendamentos', label: 'Todos Agendamentos', icon: FaList, section: 'AGENDAMENTOS' },
  { path: '/dashboard/link-publico', label: 'Link Público', icon: FaLink, section: 'CONFIGURAÇÕES' },
  { path: '/dashboard/personalizacao', label: 'Personalização', icon: FaPalette, section: 'CONFIGURAÇÕES' },
  { path: '/dashboard/google-calendar', label: 'Google Calendar', icon: FaGoogle, section: 'CONFIGURAÇÕES' },
  { path: '/dashboard/configuracoes', label: 'Configurações', icon: FaCog, section: 'CONFIGURAÇÕES' },
];

function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleItemClick = (path: string) => {
    navigate(path);
    // Fechar sidebar em mobile após clicar
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  let currentSection = '';

  return (
    <>
      {/* Overlay para mobile */}
      {!isCollapsed && (
        <div className="sidebar-overlay" onClick={onToggle} />
      )}

      <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-brand">Linea Calendar</h1>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const showSection = item.section && item.section !== currentSection;
            if (showSection) {
              currentSection = item.section!;
            }

            const IconComponent = item.icon;

            return (
              <div key={item.path}>
                {showSection && (
                  <div className="sidebar-section-title">{item.section}</div>
                )}
                <button
                  className={`sidebar-item ${isActive(item.path) ? 'sidebar-item-active' : ''}`}
                  onClick={() => handleItemClick(item.path)}
                  aria-label={item.label}
                >
                  <span className="sidebar-item-icon">
                    <IconComponent />
                  </span>
                  <span className="sidebar-item-label">{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;

