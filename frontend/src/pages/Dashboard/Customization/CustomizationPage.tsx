import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../services/firebase';
import api from '../../../services/api';
import type { User } from '../../../types';
import CollapsibleCard from '../../../components/shared/CollapsibleCard/CollapsibleCard';
import LoadingOverlay from '../../../components/shared/LoadingOverlay/LoadingOverlay';
import PublicCustomization from '../../../components/PublicCustomization/PublicCustomization';
import './CustomizationPage.css';

function CustomizationPage() {
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
      <Container className="customization-page-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  return (
    <Container className="customization-page-container">
      <Row className="customization-page-header">
        <Col xs={12}>
          <h1>Personalização</h1>
          <p>Personalize sua página pública de agendamento</p>
        </Col>
      </Row>

      <Row className="customization-page-section">
        <Col xs={12}>
          <CollapsibleCard title="Personalizar Link Público" defaultExpanded={true}>
            <PublicCustomization user={userData} onUpdate={loadUserData} />
          </CollapsibleCard>
        </Col>
      </Row>
    </Container>
  );
}

export default CustomizationPage;



