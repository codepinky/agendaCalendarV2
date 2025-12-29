import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../services/firebase';
import api from '../../../services/api';
import type { User } from '../../../types';
import { labels } from '../../../locales/pt-BR';
import Button from '../../../components/shared/Button/Button';
import CollapsibleCard from '../../../components/shared/CollapsibleCard/CollapsibleCard';
import LoadingOverlay from '../../../components/shared/LoadingOverlay/LoadingOverlay';
import { useToast } from '../../../hooks/useToast';
import './GoogleCalendarPage.css';

function GoogleCalendarPage() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      loadUserData();
    }

    // Check for Google Calendar callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('googleCalendarConnected') === 'true') {
      toast.success('Google Calendar conectado com sucesso!');
      loadUserData();
      window.history.replaceState({}, '', '/dashboard/google-calendar');
    }
    if (urlParams.get('googleCalendarError') === 'true') {
      toast.error('Erro ao conectar com Google Calendar');
      window.history.replaceState({}, '', '/dashboard/google-calendar');
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserData(response.data);
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    setConnectingGoogle(true);
    try {
      const response = await api.get('/google-calendar/auth');
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    setDisconnectingGoogle(true);
    try {
      await api.post('/google-calendar/disconnect');
      toast.success('Google Calendar desconectado');
      await loadUserData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  if (loading) {
    return (
      <Container className="google-calendar-page-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  return (
    <Container className="google-calendar-page-container">
      <Row className="google-calendar-page-header">
        <Col xs={12}>
          <h1>Google Calendar</h1>
          <p>Conecte seu Google Calendar para sincronizar agendamentos</p>
        </Col>
      </Row>

      <Row className="google-calendar-page-section">
        <Col xs={12} md={8}>
          <CollapsibleCard title={labels.googleCalendar} defaultExpanded={true}>
            {userData?.googleCalendarConnected ? (
              <>
                <p style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-md)' }}>
                  {labels.googleCalendarConnected}
                </p>
                <Button variant="danger" onClick={handleDisconnectGoogleCalendar} disabled={disconnectingGoogle}>
                  {disconnectingGoogle ? labels.loading : labels.disconnectGoogleCalendar}
                </Button>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--color-warning)', marginBottom: 'var(--spacing-md)' }}>
                  {labels.googleCalendarNotConnected}
                </p>
                <Button onClick={handleConnectGoogleCalendar} disabled={connectingGoogle}>
                  {connectingGoogle ? labels.loading : labels.connectGoogleCalendar}
                </Button>
              </>
            )}
          </CollapsibleCard>
        </Col>
      </Row>
    </Container>
  );
}

export default GoogleCalendarPage;



