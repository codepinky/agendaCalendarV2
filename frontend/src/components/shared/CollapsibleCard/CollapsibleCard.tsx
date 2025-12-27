import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card } from 'react-bootstrap';
import './CollapsibleCard.css';

interface CollapsibleCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  defaultExpanded?: boolean;
  headerActions?: ReactNode;
}

function CollapsibleCard({ 
  title, 
  children, 
  className = '',
  defaultExpanded = true,
  headerActions
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className={`collapsible-card ${className}`}>
      <Card.Header 
        className="collapsible-card-header"
        onClick={toggleExpanded}
      >
        <div className="collapsible-card-header-content">
          <h3 className="collapsible-card-title">{title}</h3>
          {headerActions && (
            <div className="collapsible-card-actions" onClick={(e) => e.stopPropagation()}>
              {headerActions}
            </div>
          )}
        </div>
        <button 
          className={`collapsible-card-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-label={isExpanded ? 'Recolher' : 'Expandir'}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M5 7.5L10 12.5L15 7.5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </Card.Header>
      <Card.Body className={`collapsible-card-body ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {isExpanded && children}
      </Card.Body>
    </Card>
  );
}

export default CollapsibleCard;

