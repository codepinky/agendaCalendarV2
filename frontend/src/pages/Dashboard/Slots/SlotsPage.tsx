import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Modal, Form } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaTrash, FaInfoCircle, FaUser } from 'react-icons/fa';
import { labels } from '../../../locales/pt-BR';
import api from '../../../services/api';
import type { AvailableSlot, Booking } from '../../../types';
import Button from '../../../components/shared/Button/Button';
import Input from '../../../components/shared/Input/Input';
import LoadingOverlay from '../../../components/shared/LoadingOverlay/LoadingOverlay';
import EmptyState from '../../../components/shared/EmptyState/EmptyState';
import { useToast } from '../../../hooks/useToast';
import './SlotsPage.css';

function SlotsPage() {
  const toast = useToast();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ativos' | 'historico'>('ativos');
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

  const startTimeMin = useMemo(() => {
    if (!slotForm.date) return undefined;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(slotForm.date + 'T00:00:00');
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    return undefined;
  }, [slotForm.date]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Função para verificar se um slot já passou (defesa em profundidade)
  const isSlotInPast = (slot: AvailableSlot): boolean => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const slotDate = new Date(slot.date + 'T00:00:00');
    slotDate.setHours(0, 0, 0, 0);
    
    // Se a data já passou
    if (slotDate < today) {
      return true;
    }
    
    // Se é hoje, verificar o horário
    if (slotDate.getTime() === today.getTime()) {
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
      return slotTime < now;
    }
    
    return false;
  };

  const loadData = async () => {
    setLoading(true);
    // Limpar slots antes de carregar novos dados para evitar mostrar dados antigos
    setSlots([]);
    try {
      const includePast = activeTab === 'historico';
      const [slotsResponse, bookingsResponse] = await Promise.all([
        api.get(`/slots${includePast ? '?includePast=true' : ''}`),
        api.get('/bookings/my-bookings'),
      ]);
      
      let slotsData = slotsResponse.data || [];
      
      // Defesa em profundidade: garantir filtragem correta em ambas as abas
      if (includePast) {
        // Histórico: mostrar APENAS slots que já passaram
        slotsData = slotsData.filter((slot: AvailableSlot) => isSlotInPast(slot));
      } else {
        // Ativos: mostrar APENAS slots que ainda não passaram
        slotsData = slotsData.filter((slot: AvailableSlot) => !isSlotInPast(slot));
      }
      
      setSlots(slotsData);
      setBookings(bookingsResponse.data.bookings || []);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Erro ao carregar horários');
      // Garantir que slots está vazio em caso de erro
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getBookingForSlot = (slotId: string): Booking | undefined => {
    return bookings.find(booking => booking.slotId === slotId && (booking.status === 'confirmed' || booking.status === 'pending'));
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = `${todayLocal.getFullYear()}-${String(todayLocal.getMonth() + 1).padStart(2, '0')}-${String(todayLocal.getDate()).padStart(2, '0')}`;
    
    if (slotForm.date < todayStr) {
      toast.error('Não é possível criar horário para uma data no passado');
      return;
    }

    if (slotForm.date === todayStr) {
      const [startHour, startMin] = slotForm.startTime.split(':').map(Number);
      
      if (isNaN(startHour) || isNaN(startMin)) {
        toast.error('Por favor, informe um horário válido');
        return;
      }
      
      const slotStartTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        startHour,
        startMin,
        0,
        0
      );
      
      if (slotStartTime < now) {
        toast.error('Não é possível criar horário com hora no passado');
        return;
      }
    }

    if (!slotForm.date || !slotForm.startTime || !slotForm.endTime) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const payload = {
      date: slotForm.date,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      maxBookings: 1,
      bufferMinutes: parseInt(slotForm.bufferMinutes) || 0,
    };

    setCreatingSlot(true);
    try {
      await api.post('/slots', payload);
      toast.success('Horário criado com sucesso!');
      setShowSlotModal(false);
      setSlotForm({ date: '', startTime: '', endTime: '', bufferMinutes: '0' });
      await loadData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setCreatingSlot(false);
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
      await loadData();
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const start = new Date(2000, 0, 1, startHour, startMin);
    const end = new Date(2000, 0, 1, endHour, endMin);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  const formatCreatedAt = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };

  if (loading) {
    return (
      <Container className="slots-page-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  return (
    <Container className="slots-page-container">
      <Row className="slots-page-header">
        <Col xs={12} md={8}>
          <h1>{labels.availableSlots}</h1>
          <p>Gerencie seus horários disponíveis</p>
        </Col>
        <Col xs={12} md={4} className="slots-page-actions">
          <Button onClick={() => setShowSlotModal(true)}>
            {labels.openSlot}
          </Button>
        </Col>
      </Row>

      <Row className="slots-page-section">
        <Col xs={12}>
          {/* Sistema de Abas */}
          <div className="slots-tabs-container" style={{ marginBottom: 'var(--spacing-lg, 1.5rem)' }}>
            <div className="slots-tabs">
              <button
                className={`slots-tab ${activeTab === 'ativos' ? 'active' : ''}`}
                onClick={() => setActiveTab('ativos')}
              >
                Ativos
              </button>
              <button
                className={`slots-tab ${activeTab === 'historico' ? 'active' : ''}`}
                onClick={() => setActiveTab('historico')}
              >
                Histórico
              </button>
            </div>
          </div>

          {slots.length === 0 ? (
            <EmptyState
              message={
                activeTab === 'ativos'
                  ? "Nenhum horário disponível. Clique em 'Abrir horário' para criar."
                  : "Nenhum horário passado encontrado."
              }
              action={
                activeTab === 'ativos'
                  ? {
                      label: labels.openSlot,
                      onClick: () => setShowSlotModal(true),
                    }
                  : undefined
              }
            />
          ) : (
            <div className="slots-list">
              {slots.map((slot) => {
                const booking = getBookingForSlot(slot.id);
                return (
                  <div key={slot.id} className="slot-item">
                    <div className="slot-main-content">
                      <div className="slot-header">
                        <div className="slot-header-left">
                          <div className="slot-date-icon">
                            <FaCalendarAlt />
                          </div>
                          <div className="slot-date-info">
                            <div className="slot-date-full">{formatDate(slot.date)}</div>
                            <div className="slot-date-short">{formatShortDate(slot.date)}</div>
                          </div>
                        </div>
                        {booking && (
                          <div className="slot-header-center">
                            <div className="slot-booking-badge">
                              <FaUser className="slot-booking-icon" />
                              <span className="slot-booking-name">{booking.clientName}</span>
                            </div>
                          </div>
                        )}
                        <div className="slot-header-right">
                          <span className={`slot-status slot-status-${slot.status}`}>
                            {slot.status === 'available' ? 'Disponível' : 
                             slot.status === 'reserved' ? 'Reservado' : 
                             slot.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                          </span>
                        </div>
                      </div>

                      <div className="slot-details">
                        <div className="slot-detail-item">
                          <div className="slot-detail-icon">
                            <FaClock />
                          </div>
                          <div className="slot-detail-content">
                            <div className="slot-detail-label">Horário</div>
                            <div className="slot-detail-value">
                              {slot.startTime} - {slot.endTime}
                            </div>
                          </div>
                        </div>

                        <div className="slot-detail-item">
                          <div className="slot-detail-icon">
                            <FaInfoCircle />
                          </div>
                          <div className="slot-detail-content">
                            <div className="slot-detail-label">Duração</div>
                            <div className="slot-detail-value">
                              {calculateDuration(slot.startTime, slot.endTime)}
                            </div>
                          </div>
                        </div>

                        {slot.bufferMinutes && slot.bufferMinutes > 0 && (
                          <div className="slot-detail-item">
                            <div className="slot-detail-icon">
                              <FaInfoCircle />
                            </div>
                            <div className="slot-detail-content">
                              <div className="slot-detail-label">Intervalo</div>
                              <div className="slot-detail-value">
                                {slot.bufferMinutes} minutos
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="slot-detail-item">
                          <div className="slot-detail-icon">
                            <FaInfoCircle />
                          </div>
                          <div className="slot-detail-content">
                            <div className="slot-detail-label">Criado em</div>
                            <div className="slot-detail-value">
                              {formatCreatedAt(slot.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="slot-actions">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteSlotClick(slot)}
                        disabled={deletingSlotId === slot.id}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                          <FaTrash /> {deletingSlotId === slot.id ? labels.loading : labels.delete}
                        </span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

export default SlotsPage;

