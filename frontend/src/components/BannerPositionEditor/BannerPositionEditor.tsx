import { useState, useEffect, useRef } from 'react';
import { Modal, Button as BootstrapButton } from 'react-bootstrap';
import Button from '../shared/Button/Button';
import './BannerPositionEditor.css';

interface BannerPositionEditorProps {
  imageUrl: string;
  currentPositionX?: number;
  currentPositionY?: number;
  onSave: (positionX: number, positionY: number) => void;
  onClose: () => void;
  show: boolean;
}

const BannerPositionEditor = ({
  imageUrl,
  currentPositionX = 50,
  currentPositionY = 50,
  onSave,
  onClose,
  show,
}: BannerPositionEditorProps) => {
  const [positionX, setPositionX] = useState(currentPositionX);
  const [positionY, setPositionY] = useState(currentPositionY);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      setPositionX(currentPositionX);
      setPositionY(currentPositionY);
    }
  }, [currentPositionX, currentPositionY, show]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updatePosition(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updatePosition = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Limitar entre 0 e 100
    setPositionX(Math.max(0, Math.min(100, x)));
    setPositionY(Math.max(0, Math.min(100, y)));
  };

  const handleSliderChange = (axis: 'x' | 'y', value: number) => {
    if (axis === 'x') {
      setPositionX(value);
    } else {
      setPositionY(value);
    }
  };

  const handleReset = () => {
    setPositionX(50);
    setPositionY(50);
  };

  const handleSave = () => {
    onSave(positionX, positionY);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered className="banner-position-editor-modal">
      <Modal.Header closeButton>
        <Modal.Title>Ajustar Posição do Banner</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="banner-position-editor-content">
          <p className="text-muted mb-3">
            Arraste a imagem ou use os controles abaixo para ajustar qual parte do banner será exibida.
          </p>

          {/* Preview do Banner */}
          <div
            ref={containerRef}
            className="banner-position-preview"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: `${positionX}% ${positionY}%`,
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="banner-position-overlay">
              <div className="banner-position-crosshair" />
              <p className="banner-position-hint">
                {isDragging ? 'Solte para definir a posição' : 'Arraste para ajustar'}
              </p>
            </div>
          </div>

          {/* Controles */}
          <div className="banner-position-controls">
            <div className="banner-position-control-group">
              <label>Posição Horizontal: {Math.round(positionX)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={positionX}
                onChange={(e) => handleSliderChange('x', Number(e.target.value))}
                className="form-range"
              />
              <div className="banner-position-control-labels">
                <span>Esquerda</span>
                <span>Centro</span>
                <span>Direita</span>
              </div>
            </div>

            <div className="banner-position-control-group">
              <label>Posição Vertical: {Math.round(positionY)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={positionY}
                onChange={(e) => handleSliderChange('y', Number(e.target.value))}
                className="form-range"
              />
              <div className="banner-position-control-labels">
                <span>Topo</span>
                <span>Centro</span>
                <span>Base</span>
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={handleReset}>
              Resetar para Centro
            </Button>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <BootstrapButton variant="secondary" onClick={onClose}>
          Cancelar
        </BootstrapButton>
        <Button onClick={handleSave}>
          Salvar Posição
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BannerPositionEditor;

