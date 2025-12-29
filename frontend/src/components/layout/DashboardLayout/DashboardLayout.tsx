import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../services/firebase';
import api from '../../../services/api';
import type { User } from '../../../types';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import LoadingOverlay from '../../shared/LoadingOverlay/LoadingOverlay';
import './DashboardLayout.css';

function DashboardLayout() {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoadingUserData(false);
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserData(response.data);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoadingUserData(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Fechar sidebar em mobile quando redimensionar para desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarCollapsed(false);
      } else {
        setSidebarCollapsed(true);
      }
    };

    // Definir estado inicial
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading || loadingUserData) {
    return <LoadingOverlay fullScreen message="Carregando..." />;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <div className="dashboard-layout-main">
        <Header user={userData} onToggleSidebar={toggleSidebar} />
        <main className="dashboard-layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;



