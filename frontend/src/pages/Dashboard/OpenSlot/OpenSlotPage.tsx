import { useState, useMemo } from 'react';
import { Container, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { labels } from '../../../locales/pt-BR';
import api from '../../../services/api';
import Button from '../../../components/shared/Button/Button';
import Input from '../../../components/shared/Input/Input';
import { useToast } from '../../../hooks/useToast';
import './OpenSlotPage.css';

function OpenSlotPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [showSlotModal, setShowSlotModal] = useState(true);
  const [slotForm, setSlotForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    bufferMinutes: '0',
  });
  const [creatingSlot, setCreatingSlot] = useState(false);

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
      navigate('/dashboard/horarios');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || labels.errorGeneric;
      toast.error(errorMessage);
    } finally {
      setCreatingSlot(false);
    }
  };

  const handleClose = () => {
    setShowSlotModal(false);
    navigate('/dashboard/horarios');
  };

  return (
    <Container className="open-slot-page-container">
      <Modal show={showSlotModal} onHide={handleClose}>
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
            <Button variant="secondary" onClick={handleClose} disabled={creatingSlot}>
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={creatingSlot}>
              {creatingSlot ? labels.loading : labels.save}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default OpenSlotPage;

