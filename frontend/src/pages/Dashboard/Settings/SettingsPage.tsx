import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../services/firebase';
import api from '../../../services/api';
import type { User } from '../../../types';
import CollapsibleCard from '../../../components/shared/CollapsibleCard/CollapsibleCard';
import LoadingOverlay from '../../../components/shared/LoadingOverlay/LoadingOverlay';
import './SettingsPage.css';

function SettingsPage() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserData();
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

  if (loading) {
    return (
      <Container className="settings-page-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  return (
    <Container className="settings-page-container">
      <Row className="settings-page-header">
        <Col xs={12}>
          <h1>Configurações</h1>
          <p>Gerencie suas configurações da conta</p>
        </Col>
      </Row>

      <Row className="settings-page-section">
        <Col xs={12}>
          <CollapsibleCard title="Informações da Conta" defaultExpanded={true}>
            <div className="settings-info">
              <p><strong>Nome:</strong> {userData?.name || 'Não informado'}</p>
              <p><strong>Email:</strong> {userData?.email || 'Não informado'}</p>
              <p><strong>Código de Licença:</strong> {userData?.licenseCode || 'Não informado'}</p>
            </div>
          </CollapsibleCard>
        </Col>
      </Row>
    </Container>
  );
}

export default SettingsPage;

