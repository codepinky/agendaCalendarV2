import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { labels } from '../../locales/pt-BR';
import api from '../../services/api';
import type { AvailableSlot, User } from '../../types';
import Button from '../../components/shared/Button/Button';
import Input from '../../components/shared/Input/Input';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    maxBookings: '1',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUserData();
    loadSlots();
    
    // Check for Google Calendar callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('googleCalendarConnected') === 'true') {
      setSuccess('Google Calendar conectado com sucesso!');
      loadUserData();
      window.history.replaceState({}, '', '/dashboard');
    }
    if (urlParams.get('googleCalendarError') === 'true') {
      setError('Erro ao conectar com Google Calendar');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  const loadUserData = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const response = await api.get('/slots');
      setSlots(response.data);
    } catch (err) {
      console.error('Error loading slots:', err);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.post('/slots', {
        date: slotForm.date,
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        maxBookings: parseInt(slotForm.maxBookings),
      });

      setSuccess('Horário criado com sucesso!');
      setShowSlotModal(false);
      setSlotForm({ date: '', startTime: '', endTime: '', maxBookings: '1' });
      loadSlots();
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
    }
  };

  const handleCopyLink = () => {
    if (user?.publicLink) {
      const link = `${window.location.origin}/schedule/${user.publicLink}`;
      navigator.clipboard.writeText(link);
      setSuccess('Link copiado!');
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      const response = await api.get('/google-calendar/auth');
      window.location.href = response.data.authUrl;
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      await api.post('/google-calendar/disconnect');
      setSuccess('Google Calendar desconectado');
      loadUserData();
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  if (loading) {
    return <Container className="dashboard-container"><div>Carregando...</div></Container>;
  }

  return (
    <Container className="dashboard-container">
      <Row className="dashboard-header">
        <Col>
          <h1>{labels.dashboard}</h1>
          <p>Bem-vindo, {user?.name}</p>
        </Col>
        <Col xs="auto">
          <Button variant="secondary" onClick={handleLogout}>
            Sair
          </Button>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="dashboard-section">
        <Col md={6}>
          <Card className="dashboard-card">
            <Card.Header>
              <h3>{labels.publicLink}</h3>
            </Card.Header>
            <Card.Body>
              {user?.publicLink ? (
                <>
                  <p className="dashboard-link">
                    {window.location.origin}/schedule/{user.publicLink}
                  </p>
                  <Button onClick={handleCopyLink}>{labels.copyLink}</Button>
                </>
              ) : (
                <p>Gerando link...</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="dashboard-card">
            <Card.Header>
              <h3>{labels.googleCalendar}</h3>
            </Card.Header>
            <Card.Body>
              {user?.googleCalendarConnected ? (
                <>
                  <Alert variant="success">{labels.googleCalendarConnected}</Alert>
                  <Button variant="danger" onClick={handleDisconnectGoogleCalendar}>
                    {labels.disconnectGoogleCalendar}
                  </Button>
                </>
              ) : (
                <>
                  <Alert variant="warning">{labels.googleCalendarNotConnected}</Alert>
                  <Button onClick={handleConnectGoogleCalendar}>{labels.connectGoogleCalendar}</Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="dashboard-section">
        <Col>
          <Card className="dashboard-card">
            <Card.Header className="dashboard-card-header">
              <h3>{labels.availableSlots}</h3>
              <Button onClick={() => setShowSlotModal(true)}>
                {labels.openSlot}
              </Button>
            </Card.Header>
            <Card.Body>
              {slots.length === 0 ? (
                <p>Nenhum horário disponível. Clique em "Abrir horário" para criar.</p>
              ) : (
                <div className="dashboard-slots-list">
                  {slots.map((slot) => (
                    <div key={slot.id} className="dashboard-slot-item">
                      <strong>{slot.date}</strong> - {slot.startTime} às {slot.endTime}
                      <span className={`dashboard-slot-status dashboard-slot-status-${slot.status}`}>
                        {slot.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showSlotModal} onHide={() => setShowSlotModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{labels.openSlot}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateSlot}>
          <Modal.Body>
            <Input
              type="date"
              label={labels.selectDate}
              value={slotForm.date}
              onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
              required
            />
            <Input
              type="time"
              label={labels.startTime}
              value={slotForm.startTime}
              onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
              required
            />
            <Input
              type="time"
              label={labels.endTime}
              value={slotForm.endTime}
              onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
              required
            />
            <Input
              type="number"
              label={labels.maxBookings}
              value={slotForm.maxBookings}
              onChange={(e) => setSlotForm({ ...slotForm, maxBookings: e.target.value })}
              required
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSlotModal(false)}>
              {labels.cancel}
            </Button>
            <Button type="submit">{labels.save}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Dashboard;
