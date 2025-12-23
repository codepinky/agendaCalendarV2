import { useState, useEffect } from 'react';
import { Container, Form } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { labels, messages } from '../../locales/pt-BR';
import api, { getPublicProfile } from '../../services/api';
import type { AvailableSlot, SocialLinks as SocialLinksType } from '../../types';
import Button from '../../components/shared/Button/Button';
import Input from '../../components/shared/Input/Input';
import LoadingOverlay from '../../components/shared/LoadingOverlay/LoadingOverlay';
import EmptyState from '../../components/shared/EmptyState/EmptyState';
import SocialLinks from '../../components/SocialLinks/SocialLinks';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import './PublicSchedule.css';

function PublicSchedule() {
  const { publicLink } = useParams<{ publicLink: string }>();
  const toast = useToast();
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicTitle, setPublicTitle] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinksType>({});
  const [publicProfile, setPublicProfile] = useState<{
    profileImageUrl?: string;
    bannerImageUrl?: string;
    backgroundImageUrl?: string;
    description?: string;
    mainUsername?: string;
  }>({});
  const [booking, setBooking] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // DEBOUNCE: Valores debounced para validações
  const debouncedEmail = useDebounce(booking.clientEmail, 300);
  const debouncedPhone = useDebounce(booking.clientPhone, 300);

  // Validação em tempo real (sem debounce para feedback imediato de formato)
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'clientEmail':
        if (!value) {
          newErrors.clientEmail = labels.errorRequired;
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors.clientEmail = labels.errorInvalidEmail;
          } else {
            delete newErrors.clientEmail;
          }
        }
        break;
      case 'clientPhone':
        if (!value) {
          newErrors.clientPhone = labels.errorRequired;
        } else {
          // Validação básica de telefone brasileiro
          const phoneRegex = /^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/;
          if (!phoneRegex.test(value)) {
            newErrors.clientPhone = labels.errorInvalidPhone;
          } else {
            delete newErrors.clientPhone;
          }
        }
        break;
      case 'clientName':
        if (!value) {
          newErrors.clientName = labels.errorRequired;
        } else {
          delete newErrors.clientName;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // Função para formatar telefone brasileiro: (00) 00000-0000 ou (00) 0000-0000
  const formatPhone = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limitedNumbers.length <= 2) {
      return limitedNumbers ? `(${limitedNumbers}` : '';
    } else if (limitedNumbers.length <= 7) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
    }
  };

  const handleBookingChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Formatar telefone automaticamente
    if (field === 'clientPhone') {
      value = formatPhone(value);
    }
    
    setBooking({ ...booking, [field]: value });
    validateField(field, value);
  };

  useEffect(() => {
    if (publicLink) {
      loadPublicProfile();
      loadAvailableSlots();
    }
  }, [publicLink]);

  const loadPublicProfile = async () => {
    try {
      const response = await getPublicProfile(publicLink!);
      setPublicTitle(response.data.publicTitle || labels.bookAppointment);
      setSocialLinks(response.data.socialLinks || {});
      setPublicProfile({
        profileImageUrl: response.data.profileImageUrl,
        bannerImageUrl: response.data.bannerImageUrl,
        backgroundImageUrl: response.data.backgroundImageUrl,
        description: response.data.description,
        mainUsername: response.data.mainUsername,
      });
    } catch (err: any) {
      // Se falhar, usar título padrão
      setPublicTitle(labels.bookAppointment);
      console.error('Error loading public profile:', err);
    }
  };

  // Função para formatar data em português: "Qui 26 de Dezembro"
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${dayOfWeek} ${day} de ${month}`;
  };

  // DEBOUNCE: Validar email após debounce (300ms)
  useEffect(() => {
    if (debouncedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(debouncedEmail)) {
        setErrors((prev) => ({
          ...prev,
          clientEmail: labels.errorInvalidEmail,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.clientEmail;
          return newErrors;
        });
      }
    } else if (debouncedEmail === '') {
      // Limpar erro se campo estiver vazio
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.clientEmail;
        return newErrors;
      });
    }
  }, [debouncedEmail]);

  // DEBOUNCE: Validar telefone após debounce (300ms)
  useEffect(() => {
    if (debouncedPhone) {
      const phoneRegex = /^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/;
      if (!phoneRegex.test(debouncedPhone)) {
        setErrors((prev) => ({
          ...prev,
          clientPhone: labels.errorInvalidPhone,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.clientPhone;
          return newErrors;
        });
      }
    } else if (debouncedPhone === '') {
      // Limpar erro se campo estiver vazio
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.clientPhone;
        return newErrors;
      });
    }
  }, [debouncedPhone]);

  const loadAvailableSlots = async () => {
    try {
      const response = await api.get(`/bookings/slots/${publicLink}`);
      setSlots(response.data.slots || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!booking.clientName) newErrors.clientName = labels.errorRequired;
    if (!booking.clientEmail) newErrors.clientEmail = labels.errorRequired;
    if (!booking.clientPhone) {
      newErrors.clientPhone = labels.errorRequired;
    } else {
      // Validar formato de telefone
      const phoneRegex = /^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/;
      if (!phoneRegex.test(booking.clientPhone)) {
        newErrors.clientPhone = labels.errorInvalidPhone;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (booking.clientEmail && !emailRegex.test(booking.clientEmail)) {
      newErrors.clientEmail = labels.errorInvalidEmail;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedSlot) {
      toast.warning('Selecione um horário');
      return;
    }

    setSubmitting(true);

    try {
      // Garantir que o telefone está formatado corretamente antes de enviar
      const formattedPhone = booking.clientPhone.match(/^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/) 
        ? booking.clientPhone 
        : formatPhone(booking.clientPhone);
      
      await api.post('/bookings', {
        publicLink,
        slotId: selectedSlot.id,
        ...booking,
        clientPhone: formattedPhone,
      });

      toast.success(messages.successBookingCreated);
      setSelectedSlot(null);
      setBooking({ clientName: '', clientEmail: '', clientPhone: '', notes: '' });
      loadAvailableSlots();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="public-schedule-container">
        <LoadingOverlay fullScreen message="Carregando horários disponíveis..." />
      </Container>
    );
  }

  return (
    <div className="public-schedule-wrapper">
      {/* Banner Full Width - Estilo X/Twitter */}
      {(publicProfile.bannerImageUrl || publicProfile.profileImageUrl) && (
        <div className="public-profile-header">
          <div 
            className={`public-profile-banner ${!publicProfile.bannerImageUrl ? 'no-banner' : ''}`}
            style={{
              ...(publicProfile.bannerImageUrl && {
                backgroundImage: `url(${publicProfile.bannerImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }),
            }}
          >
            {publicProfile.profileImageUrl && (
              <div className="public-profile-picture-container">
                <img 
                  src={publicProfile.profileImageUrl} 
                  alt="Foto de perfil" 
                  className="public-profile-picture"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <Container className="public-schedule-container">
        {/* Área Neutra com Fundo Branco - Nome, @ e Descrição */}
        <div className="public-profile-neutral-area">
          <div className="public-profile-info">
            <h1 className="public-schedule-title">{publicTitle || labels.bookAppointment}</h1>
            {publicProfile.mainUsername && (
              <p className="public-profile-username">@{publicProfile.mainUsername}</p>
            )}
            {publicProfile.description && (
              <p className="public-profile-description">{publicProfile.description}</p>
            )}
          </div>
        </div>
      </Container>

      {/* Conteúdo Principal - Links e Agendamento */}
      <div 
        className="public-profile-content-wrapper"
        data-has-background={publicProfile.backgroundImageUrl ? 'true' : undefined}
        style={{
          ...(publicProfile.backgroundImageUrl && {
            '--bg-image': `url(${publicProfile.backgroundImageUrl})`,
          } as React.CSSProperties),
        }}
      >
        <Container className="public-schedule-container">
          <div 
            className="public-profile-content"
            style={{
              backgroundImage: publicProfile.backgroundImageUrl ? `url(${publicProfile.backgroundImageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          >

          {/* Redes Sociais - Ícones no topo */}
          {Object.keys(socialLinks).length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-lg, 1.5rem)', display: 'flex', justifyContent: 'center' }}>
              <SocialLinks socialLinks={socialLinks} />
            </div>
          )}

          {/* Lista de Links - Estilo AllMyLinks */}
          <div className="public-links-list">
            {/* Agendamento - Como item na lista */}
            {slots.length > 0 && (
              <div className="booking-section">
                <div className="booking-section-header">
                  <h3 className="booking-section-title">Agendar Horário</h3>
                </div>
                
                {!selectedSlot ? (
                  <div className="booking-slots-grid">
                    {slots.map((slot, index) => (
                      <button
                        key={slot.id}
                        className="booking-slot-button"
                        onClick={() => handleSlotSelect(slot)}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="booking-slot-date">{formatDate(slot.date)}</div>
                        <div className="booking-slot-time">{slot.startTime}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="booking-form-container">
                    <div className="booking-selected-info">
                      <strong>Horário selecionado:</strong>
                      <div>{formatDate(selectedSlot.date)} - {selectedSlot.startTime}</div>
                    </div>
                    <Form onSubmit={handleSubmit} className="booking-form">
                      <Input
                        label={labels.clientName}
                        placeholder={labels.clientNamePlaceholder}
                        value={booking.clientName}
                        onChange={handleBookingChange('clientName')}
                        error={errors.clientName}
                        required
                      />
                      <Input
                        type="email"
                        label={labels.clientEmail}
                        placeholder={labels.clientEmailPlaceholder}
                        value={booking.clientEmail}
                        onChange={handleBookingChange('clientEmail')}
                        error={errors.clientEmail}
                        required
                      />
                      <Input
                        label={labels.clientPhone}
                        placeholder={labels.clientPhonePlaceholder}
                        value={booking.clientPhone}
                        onChange={handleBookingChange('clientPhone')}
                        error={errors.clientPhone}
                        required
                      />
                      <Input
                        as="textarea"
                        rows={4}
                        label={labels.notes}
                        placeholder={labels.notesPlaceholder}
                        value={booking.notes}
                        onChange={handleBookingChange('notes')}
                      />
                      <div className="booking-form-actions">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          onClick={() => setSelectedSlot(null)}
                          className="booking-cancel-button"
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? labels.loading : labels.bookAppointment}
                        </Button>
                      </div>
                    </Form>
                  </div>
                )}
              </div>
            )}

            {slots.length === 0 && (
              <div className="empty-booking-state">
                <EmptyState message="Nenhum horário disponível no momento." />
              </div>
            )}
          </div>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default PublicSchedule;
