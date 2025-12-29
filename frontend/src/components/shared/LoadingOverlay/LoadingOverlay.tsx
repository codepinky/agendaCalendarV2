import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import './LoadingOverlay.css';

interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
}

function LoadingOverlay({ message, fullScreen = false }: LoadingOverlayProps) {
  return (
    <div className={`loading-overlay ${fullScreen ? 'loading-overlay-fullscreen' : ''}`}>
      <div className="loading-overlay-content">
        <LoadingSpinner size="lg" />
        {message && <p className="loading-overlay-message">{message}</p>}
      </div>
    </div>
  );
}

export default LoadingOverlay;







