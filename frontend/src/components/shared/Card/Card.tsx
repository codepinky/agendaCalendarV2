import { Card as BootstrapCard } from 'react-bootstrap';
import './Card.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

function Card({ title, children, className = '' }: CardProps) {
  return (
    <BootstrapCard className={`shared-card ${className}`}>
      {title && <BootstrapCard.Header>{title}</BootstrapCard.Header>}
      <BootstrapCard.Body>{children}</BootstrapCard.Body>
    </BootstrapCard>
  );
}

export default Card;













