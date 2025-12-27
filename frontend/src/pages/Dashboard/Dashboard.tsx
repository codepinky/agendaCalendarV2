import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { labels } from '../../locales/pt-BR';
import api from '../../services/api';
import type { AvailableSlot, User, Booking } from '../../types';
import Button from '../../components/shared/Button/Button';
import Input from '../../components/shared/Input/Input';
import ThemeToggle from '../../components/shared/ThemeToggle/ThemeToggle';
import CollapsibleCard from '../../components/shared/CollapsibleCard/CollapsibleCard';
import LoadingOverlay from '../../components/shared/LoadingOverlay/LoadingOverlay';
import EmptyState from '../../components/shared/EmptyState/EmptyState';
import { useToast } from '../../hooks/useToast';
import PublicCustomization from '../../components/PublicCustomization/PublicCustomization';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    bufferMinutes: '0',
  });
  const [creatingSlot, setCreatingSlot] = useState(false);
  const [deletingSlotId, setDeletingSlotId] = useState<string | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<AvailableSlot | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copyingLink, setCopyingLink] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);

  // Calcular o minTime para o campo de horário de início
  // Só aplicar restrição se a data selecionada for hoje
  const startTimeMin = useMemo(() => {
    if (!slotForm.date) return undefined;
    
    // Comparar datas de forma segura (sem hora)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(slotForm.date + 'T00:00:00');
    selectedDate.setHours(0, 0, 0, 0);
    
    // Só aplicar restrição de min se a data selecionada for exatamente hoje
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    // Se a data for futura ou passada, não aplicar min
    return undefined;
  }, [slotForm.date]);

  useEffect(() => {
    loadUserData();
    loadSlots();
    loadBookings();
    
    // Check for Google Calendar callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('googleCalendarConnected') === 'true') {
      toast.success('Google Calendar conectado com sucesso!');
      loadUserData();
      window.history.replaceState({}, '', '/dashboard');
    }
    if (urlParams.get('googleCalendarError') === 'true') {
      toast.error('Erro ao conectar com Google Calendar');
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

  const loadBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 handleCreateSlot chamado', { slotForm });

    // Validate date is not in the past
    // Usar data LOCAL, não UTC, para evitar problemas de timezone
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
    
    console.log('📅 Comparando datas:', { 
      slotDate: slotForm.date, 
      today: todayStr, 
      todayLocal: todayLocal.toLocaleDateString('pt-BR'),
      nowLocal: now.toLocaleDateString('pt-BR'),
      isToday: slotForm.date === todayStr, 
      isFuture: slotForm.date > todayStr 
    });
    
    if (slotForm.date < todayStr) {
      console.log('❌ Data no passado');
      toast.error('Não é possível criar horário para uma data no passado');
      return;
    }

    // If date is today, validate time is not in the past
    // IMPORTANTE: Só validar hora se a data for EXATAMENTE hoje (data local)
    if (slotForm.date === todayStr) {
      console.log('📅 Data é HOJE (local), validando hora...');
      const [startHour, startMin] = slotForm.startTime.split(':').map(Number);
      
      // Verificar se os valores são válidos
      if (isNaN(startHour) || isNaN(startMin)) {
        console.log('❌ Hora inválida');
        toast.error('Por favor, informe um horário válido');
        return;
      }
      
      // Criar data/hora do slot usando a data local de hoje
      const slotStartTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        startHour,
        startMin,
        0,
        0
      );
      
      console.log('⏰ Comparando horários:', { 
        slotStartTime: slotStartTime.toISOString(), 
        now: now.toISOString(),
        slotStartTimeLocal: slotStartTime.toLocaleString('pt-BR'),
        nowLocal: now.toLocaleString('pt-BR'),
        isPast: slotStartTime < now
      });
      
      if (slotStartTime < now) {
        console.log('❌ Hora no passado');
        toast.error('Não é possível criar horário com hora no passado');
        return;
      }
    } else {
      // Data é futura, não precisa validar hora atual
      console.log('✅ Data é FUTURA, pulando validação de hora');
    }

    // Validação adicional: verificar se campos obrigatórios estão preenchidos
    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
      console.log('❌ Campos obrigatórios faltando', { slotForm });
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const payload = {
      date: slotForm.date,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      maxBookings: 1, // Sempre 1 agendamento por slot
      bufferMinutes: parseInt(slotForm.bufferMinutes) || 0,
    };

    console.log('📤 Enviando requisição:', payload);

    setCreatingSlot(true);
    try {
      const response = await api.post('/slots', payload);
      console.log('✅ Resposta do servidor:', response.data);

      toast.success('Horário criado com sucesso!');
      setShowSlotModal(false);
      setSlotForm({ date: '', startTime: '', endTime: '', bufferMinutes: '0' });
      await loadSlots();
      await loadBookings();
    } catch (err: any) {
      console.error('❌ Erro ao criar slot:', err);
      console.error('❌ Detalhes do erro:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setCreatingSlot(false);
    }
  };

  const handleCopyLink = async () => {
    if (user?.publicLink) {
      setCopyingLink(true);
      try {
        const link = `${window.location.origin}/schedule/${user.publicLink}`;
        await navigator.clipboard.writeText(link);
        toast.success('Link copiado!');
      } catch (err) {
        toast.error('Erro ao copiar link');
      } finally {
        setCopyingLink(false);
      }
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

  const handleDeleteSlotClick = (slot: AvailableSlot) => {
    setSlotToDelete(slot);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!slotToDelete) return;

    setDeletingSlotId(slotToDelete.id);

    try {
      await api.delete(`/slots/${slotToDelete.id}`);
      toast.success('Horário deletado com sucesso!');
      setShowDeleteModal(false);
      setSlotToDelete(null);
      await loadSlots();
      await loadBookings();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setDeletingSlotId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSlotToDelete(null);
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <Container className="dashboard-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  return (
    <Container className="dashboard-container">
      <Row className="dashboard-header">
        <Col xs={12} md={8}>
          <h1>{labels.dashboard}</h1>
          <p>Bem-vindo, {user?.name}</p>
        </Col>
        <Col xs={12} md={4} className="dashboard-header-actions">
          <ThemeToggle />
          <Button variant="secondary" onClick={handleLogout}>
            Sair
          </Button>
        </Col>
      </Row>

      <Row className="dashboard-section">
        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <CollapsibleCard title={labels.publicLink}>
            {user?.publicLink ? (
              <>
                <p className="dashboard-link">
                  {window.location.origin}/schedule/{user.publicLink}
                </p>
                <Button onClick={handleCopyLink} disabled={copyingLink}>
                  {copyingLink ? labels.loading : labels.copyLink}
                </Button>
              </>
            ) : (
              <p>Gerando link...</p>
            )}
          </CollapsibleCard>
        </Col>

        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <CollapsibleCard title={labels.googleCalendar}>
            {user?.googleCalendarConnected ? (
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

      <Row className="dashboard-section">
        <Col xs={12} className="mb-3 mb-md-4">
          <CollapsibleCard title={labels.customizePublicLink}>
            <PublicCustomization user={user} onUpdate={loadUserData} />
          </CollapsibleCard>
        </Col>
      </Row>

      <Row className="dashboard-section">
        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <CollapsibleCard 
            title={labels.availableSlots}
            headerActions={
              <Button size="sm" onClick={() => setShowSlotModal(true)}>
                {labels.openSlot}
              </Button>
            }
          >
            {slots.length === 0 ? (
              <EmptyState
                message="Nenhum horário disponível. Clique em 'Abrir horário' para criar."
                action={{
                  label: labels.openSlot,
                  onClick: () => setShowSlotModal(true),
                }}
              />
            ) : (
              <div className="dashboard-slots-list">
                {slots.map((slot) => (
                  <div key={slot.id} className="dashboard-slot-item">
                    <div className="dashboard-slot-info">
                      <div className="dashboard-slot-date-time">
                        <span className="dashboard-slot-date">{slot.date}</span>
                        <span className="dashboard-slot-time">{slot.startTime} - {slot.endTime}</span>
                      </div>
                      <span className={`dashboard-slot-status dashboard-slot-status-${slot.status}`}>
                        {slot.status === 'available' ? 'Disponível' : 
                         slot.status === 'reserved' ? 'Reservado' : 'Confirmado'}
                      </span>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteSlotClick(slot)}
                      disabled={deletingSlotId === slot.id}
                    >
                      {deletingSlotId === slot.id ? labels.loading : labels.delete}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleCard>
        </Col>

        <Col xs={12} md={6} className="mb-3 mb-md-4">
          <CollapsibleCard title="Agendamentos">
            {bookings.length === 0 ? (
              <EmptyState message="Nenhum agendamento ainda." />
            ) : (
              <div className="dashboard-bookings-list">
                {bookings.map((booking) => (
                  <div key={booking.id} className="dashboard-booking-item">
                    <div className="dashboard-booking-header">
                      <strong>{booking.clientName}</strong>
                      <span className={`dashboard-booking-status dashboard-booking-status-${booking.status}`}>
                        {booking.status === 'confirmed' ? 'Confirmado' : 
                         booking.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </div>
                    <div className="dashboard-booking-details">
                      <p><strong>Data:</strong> {booking.date} - {booking.startTime} às {booking.endTime}</p>
                      <p><strong>Email:</strong> {booking.clientEmail}</p>
                      <p><strong>Telefone:</strong> {booking.clientPhone}</p>
                      {booking.notes && <p><strong>Observações:</strong> {booking.notes}</p>}
                      <p className="dashboard-booking-meta">
                        Agendado em: {new Date(booking.reservedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleCard>
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
              onChange={(e) => {
                const newDate = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                setSlotForm({ 
                  ...slotForm, 
                  date: newDate,
                  // Reset times if date changed to past
                  startTime: newDate < today ? '' : slotForm.startTime,
                  endTime: newDate < today ? '' : slotForm.endTime,
                });
              }}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            <Input
              key={`startTime-${slotForm.date || 'no-date'}`}
              type="time"
              label={labels.startTime}
              value={slotForm.startTime}
              onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
              min={startTimeMin}
              required
            />
            <Input
              type="time"
              label={labels.endTime}
              value={slotForm.endTime}
              onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
              min={slotForm.startTime || undefined}
              required
            />
            <Input
              type="number"
              label={labels.bufferMinutes}
              value={slotForm.bufferMinutes}
              onChange={(e) => setSlotForm({ ...slotForm, bufferMinutes: e.target.value })}
              min="0"
              max="1440"
              placeholder="0"
              helpText={labels.bufferMinutesHelp}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowSlotModal(false)} disabled={creatingSlot}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={creatingSlot}>
              {creatingSlot ? labels.loading : labels.save}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showDeleteModal} onHide={handleCancelDelete}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Tem certeza que deseja deletar este horário?</p>
          {slotToDelete && (
            <div className="mt-3 p-3 bg-light rounded">
              <strong>Data:</strong> {slotToDelete.date}<br />
              <strong>Horário:</strong> {slotToDelete.startTime} às {slotToDelete.endTime}<br />
              <strong>Status:</strong> {slotToDelete.status}
            </div>
          )}
          <div className="mt-3 p-3" style={{ 
            backgroundColor: 'var(--color-warning)', 
            color: 'var(--color-text-inverse)', 
            borderRadius: 'var(--border-radius-lg)',
            fontSize: 'var(--font-size-sm)'
          }}>
            ⚠️ Esta ação não pode ser desfeita. Se houver agendamentos confirmados, a exclusão será bloqueada.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelDelete} disabled={deletingSlotId !== null}>
            {labels.cancel}
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={deletingSlotId !== null}>
            {deletingSlotId !== null ? labels.loading : labels.delete}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default Dashboard;
