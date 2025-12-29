import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../services/firebase';
import api from '../../services/api';
import type { AvailableSlot, User, Booking } from '../../types';
import LoadingOverlay from '../../components/shared/LoadingOverlay/LoadingOverlay';
import Button from '../../components/shared/Button/Button';
import { FaCalendarAlt, FaClock, FaList, FaLink, FaPalette, FaGoogle } from 'react-icons/fa';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [userResponse, slotsResponse, bookingsResponse] = await Promise.all([
        api.get('/auth/me'),
        api.get('/slots'),
        api.get('/bookings/my-bookings'),
      ]);
      setUserData(userResponse.data);
      setSlots(slotsResponse.data);
      setBookings(bookingsResponse.data.bookings || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const todayBookings = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return bookings.filter(booking => booking.date === todayStr);
  }, [bookings]);

  const availableSlots = useMemo(() => {
    return slots.filter(slot => slot.status === 'available');
  }, [slots]);

  if (loading) {
    return (
      <Container className="dashboard-overview-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  return (
    <Container className="dashboard-overview-container">
      <Row className="dashboard-overview-header">
        <Col xs={12}>
          <h1>Dashboard</h1>
          <p>Bem-vindo, {userData?.name || 'Usuário'}</p>
        </Col>
      </Row>

      <Row className="dashboard-overview-stats">
        <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
          <div className="dashboard-stat-card shared-card">
            <div className="dashboard-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-info)' }}>
              <FaCalendarAlt />
            </div>
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-value">{slots.length}</div>
              <div className="dashboard-stat-label">Horários Disponíveis</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
          <div className="dashboard-stat-card shared-card">
            <div className="dashboard-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' }}>
              <FaClock />
            </div>
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-value">{todayBookings.length}</div>
              <div className="dashboard-stat-label">Agendamentos Hoje</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
          <div className="dashboard-stat-card shared-card">
            <div className="dashboard-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' }}>
              <FaList />
            </div>
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-value">{bookings.length}</div>
              <div className="dashboard-stat-label">Total Agendamentos</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6} md={3} className="mb-3 mb-md-0">
          <div className="dashboard-stat-card shared-card">
            <div className="dashboard-stat-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--color-primary)' }}>
              <FaCalendarAlt />
            </div>
            <div className="dashboard-stat-content">
              <div className="dashboard-stat-value">{availableSlots.length}</div>
              <div className="dashboard-stat-label">Disponíveis</div>
            </div>
          </div>
        </Col>
      </Row>

      <Row className="dashboard-overview-actions">
        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <div className="dashboard-action-card shared-card">
            <div className="dashboard-action-header">
              <FaCalendarAlt className="dashboard-action-icon" />
              <h3>Horários</h3>
            </div>
            <p className="dashboard-action-description">
              Gerencie seus horários disponíveis e crie novos slots de agendamento.
            </p>
            <div className="dashboard-action-buttons">
              <Button size="sm" onClick={() => navigate('/dashboard/horarios/abrir')}>
                Abrir Horário
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/horarios')}>
                Ver Horários
              </Button>
            </div>
          </div>
        </Col>
        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <div className="dashboard-action-card shared-card">
            <div className="dashboard-action-header">
              <FaClock className="dashboard-action-icon" />
              <h3>Agendamentos</h3>
            </div>
            <p className="dashboard-action-description">
              Visualize e gerencie seus agendamentos.
            </p>
            <div className="dashboard-action-buttons">
              <Button size="sm" onClick={() => navigate('/dashboard/agendamentos/hoje')}>
                Agendamentos Hoje
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/agendamentos')}>
                Todos Agendamentos
              </Button>
            </div>
          </div>
        </Col>
        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <div className="dashboard-action-card shared-card">
            <div className="dashboard-action-header">
              <FaLink className="dashboard-action-icon" />
              <h3>Link Público</h3>
            </div>
            <p className="dashboard-action-description">
              Compartilhe seu link público para receber agendamentos.
            </p>
            <div className="dashboard-action-buttons">
              <Button size="sm" onClick={() => navigate('/dashboard/link-publico')}>
                Ver Link
              </Button>
            </div>
          </div>
        </Col>
        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <div className="dashboard-action-card shared-card">
            <div className="dashboard-action-header">
              <FaPalette className="dashboard-action-icon" />
              <h3>Personalização</h3>
            </div>
            <p className="dashboard-action-description">
              Personalize sua página pública de agendamento.
            </p>
            <div className="dashboard-action-buttons">
              <Button size="sm" onClick={() => navigate('/dashboard/personalizacao')}>
                Personalizar
              </Button>
            </div>
          </div>
        </Col>
        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <div className="dashboard-action-card shared-card">
            <div className="dashboard-action-header">
              <FaGoogle className="dashboard-action-icon" />
              <h3>Google Calendar</h3>
            </div>
            <p className="dashboard-action-description">
              {userData?.googleCalendarConnected 
                ? 'Google Calendar conectado. Clique para gerenciar.'
                : 'Conecte seu Google Calendar para sincronizar agendamentos.'}
            </p>
            <div className="dashboard-action-buttons">
              <Button size="sm" onClick={() => navigate('/dashboard/google-calendar')}>
                {userData?.googleCalendarConnected ? 'Gerenciar' : 'Conectar'}
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default Dashboard;
