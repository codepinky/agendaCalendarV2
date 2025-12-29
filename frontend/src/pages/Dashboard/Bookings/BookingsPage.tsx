import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import api from '../../../services/api';
import type { Booking } from '../../../types';
import LoadingOverlay from '../../../components/shared/LoadingOverlay/LoadingOverlay';
import EmptyState from '../../../components/shared/EmptyState/EmptyState';
import './BookingsPage.css';

function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      setBookings(response.data.bookings || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="bookings-page-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  return (
    <Container className="bookings-page-container">
      <Row className="bookings-page-header">
        <Col xs={12}>
          <h1>Todos os Agendamentos</h1>
          <p>Visualize todos os seus agendamentos</p>
        </Col>
      </Row>

      <Row className="bookings-page-section">
        <Col xs={12}>
          {bookings.length === 0 ? (
            <EmptyState message="Nenhum agendamento ainda." />
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-header">
                    <strong>{booking.clientName}</strong>
                    <span className={`booking-status booking-status-${booking.status}`}>
                      {booking.status === 'confirmed' ? 'Confirmado' : 
                       booking.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </div>
                  <div className="booking-details">
                    <p><strong>Data:</strong> {booking.date} - {booking.startTime} às {booking.endTime}</p>
                    <p><strong>Email:</strong> {booking.clientEmail}</p>
                    <p><strong>Telefone:</strong> {booking.clientPhone}</p>
                    {booking.notes && <p><strong>Observações:</strong> {booking.notes}</p>}
                    <p className="booking-meta">
                      Agendado em: {new Date(booking.reservedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default BookingsPage;



