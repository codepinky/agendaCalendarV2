import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { labels, messages } from '../../locales/pt-BR';
import api from '../../services/api';
import type { AvailableSlot } from '../../types';
import Button from '../../components/shared/Button/Button';
import Input from '../../components/shared/Input/Input';
import './PublicSchedule.css';

function PublicSchedule() {
  const { publicLink } = useParams<{ publicLink: string }>();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (publicLink) {
      loadAvailableSlots();
    }
  }, [publicLink]);

  const loadAvailableSlots = async () => {
    try {
      const response = await api.get(`/bookings/slots/${publicLink}`);
      setSlots(response.data.slots || []);
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setError('');
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!booking.clientName) newErrors.clientName = labels.errorRequired;
    if (!booking.clientEmail) newErrors.clientEmail = labels.errorRequired;
    if (!booking.clientPhone) newErrors.clientPhone = labels.errorRequired;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (booking.clientEmail && !emailRegex.test(booking.clientEmail)) {
      newErrors.clientEmail = labels.errorInvalidEmail;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedSlot) {
      setError('Selecione um horário');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/bookings', {
        publicLink,
        slotId: selectedSlot.id,
        ...booking,
      });

      setSuccess(true);
      setSelectedSlot(null);
      setBooking({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
      loadAvailableSlots();
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="public-schedule-container">
        <div>Carregando...</div>
      </Container>
    );
  }

  return (
    <Container className="public-schedule-container">
      <Row>
        <Col>
          <h1 className="public-schedule-title">{labels.bookAppointment}</h1>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{messages.successBookingCreated}</Alert>}

      <Row>
        <Col md={selectedSlot ? 6 : 12}>
          <Card className="public-schedule-card">
            <Card.Header>
              <h3>Horários Disponíveis</h3>
            </Card.Header>
            <Card.Body>
              {slots.length === 0 ? (
                <p>Nenhum horário disponível no momento.</p>
              ) : (
                <div className="public-schedule-slots">
                  {slots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`public-schedule-slot ${
                        selectedSlot?.id === slot.id ? 'public-schedule-slot-selected' : ''
                      }`}
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <div className="public-schedule-slot-date">{slot.date}</div>
                      <div className="public-schedule-slot-time">
                        {slot.startTime} - {slot.endTime}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {selectedSlot && (
          <Col md={6}>
            <Card className="public-schedule-card">
              <Card.Header>
                <h3>Preencha seus dados</h3>
              </Card.Header>
              <Card.Body>
                <p className="public-schedule-selected-slot">
                  <strong>Horário selecionado:</strong> {selectedSlot.date} - {selectedSlot.startTime} às {selectedSlot.endTime}
                </p>
                <Form onSubmit={handleSubmit}>
                  <Input
                    label={labels.clientName}
                    placeholder={labels.clientNamePlaceholder}
                    value={booking.clientName}
                    onChange={(e) => setBooking({ ...booking, clientName: e.target.value })}
                    error={errors.clientName}
                    required
                  />
                  <Input
                    type="email"
                    label={labels.clientEmail}
                    placeholder={labels.clientEmailPlaceholder}
                    value={booking.clientEmail}
                    onChange={(e) => setBooking({ ...booking, clientEmail: e.target.value })}
                    error={errors.clientEmail}
                    required
                  />
                  <Input
                    label={labels.clientPhone}
                    placeholder={labels.clientPhonePlaceholder}
                    value={booking.clientPhone}
                    onChange={(e) => setBooking({ ...booking, clientPhone: e.target.value })}
                    error={errors.clientPhone}
                    required
                  />
                  <Input
                    label={labels.notes}
                    placeholder={labels.notesPlaceholder}
                    value={booking.notes}
                    onChange={(e) => setBooking({ ...booking, notes: e.target.value })}
                  />
                  <Button type="submit" disabled={submitting}>
                    {submitting ? labels.loading : labels.bookAppointment}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
}

export default PublicSchedule;
