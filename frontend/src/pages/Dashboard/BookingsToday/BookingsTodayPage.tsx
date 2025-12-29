import { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import api from '../../../services/api';
import type { Booking } from '../../../types';
import LoadingOverlay from '../../../components/shared/LoadingOverlay/LoadingOverlay';
import EmptyState from '../../../components/shared/EmptyState/EmptyState';
import './BookingsTodayPage.css';

function BookingsTodayPage() {
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

  const todayBookings = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    return bookings.filter(booking => booking.date === todayStr);
  }, [bookings]);

  if (loading) {
    return (
      <Container className="bookings-today-page-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  const today = new Date();
  const todayFormatted = today.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <Container className="bookings-today-page-container">
      <Row className="bookings-today-page-header">
        <Col xs={12}>
          <h1>Agendamentos do Dia</h1>
          <p>{todayFormatted}</p>
        </Col>
      </Row>

      <Row className="bookings-today-page-section">
        <Col xs={12}>
          {todayBookings.length === 0 ? (
            <EmptyState message="Nenhum agendamento para hoje." />
          ) : (
            <div className="bookings-today-list">
              {todayBookings.map((booking) => (
                <div key={booking.id} className="booking-today-item">
                  <div className="booking-today-header">
                    <div className="booking-today-time">
                      <span className="booking-today-time-value">{booking.startTime}</span>
                      <span className="booking-today-time-separator">-</span>
                      <span className="booking-today-time-value">{booking.endTime}</span>
                    </div>
                    <span className={`booking-today-status booking-today-status-${booking.status}`}>
                      {booking.status === 'confirmed' ? 'Confirmado' : 
                       booking.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </div>
                  <div className="booking-today-details">
                    <h3 className="booking-today-name">{booking.clientName}</h3>
                    <p><strong>Email:</strong> {booking.clientEmail}</p>
                    <p><strong>Telefone:</strong> {booking.clientPhone}</p>
                    {booking.notes && <p><strong>Observações:</strong> {booking.notes}</p>}
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

export default BookingsTodayPage;



