import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../services/firebase';
import api from '../../../services/api';
import type { User } from '../../../types';
import { labels } from '../../../locales/pt-BR';
import Button from '../../../components/shared/Button/Button';
import CollapsibleCard from '../../../components/shared/CollapsibleCard/CollapsibleCard';
import LoadingOverlay from '../../../components/shared/LoadingOverlay/LoadingOverlay';
import { useToast } from '../../../hooks/useToast';
import './PublicLinkPage.css';

function PublicLinkPage() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyingLink, setCopyingLink] = useState(false);
  const toast = useToast();

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

  const handleCopyLink = async () => {
    if (userData?.publicLink) {
      setCopyingLink(true);
      try {
        const link = `${window.location.origin}/schedule/${userData.publicLink}`;
        await navigator.clipboard.writeText(link);
        toast.success('Link copiado!');
      } catch (err) {
        toast.error('Erro ao copiar link');
      } finally {
        setCopyingLink(false);
      }
    }
  };

  if (loading) {
    return (
      <Container className="public-link-page-container">
        <LoadingOverlay fullScreen message="Carregando..." />
      </Container>
    );
  }

  return (
    <Container className="public-link-page-container">
      <Row className="public-link-page-header">
        <Col xs={12}>
          <h1>Link Público</h1>
          <p>Compartilhe seu link público para receber agendamentos</p>
        </Col>
      </Row>

      <Row className="public-link-page-section">
        <Col xs={12} md={8}>
          <CollapsibleCard title={labels.publicLink} defaultExpanded={true}>
            {userData?.publicLink ? (
              <>
                <p className="public-link-value">
                  {window.location.origin}/schedule/{userData.publicLink}
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
      </Row>
    </Container>
  );
}

export default PublicLinkPage;



