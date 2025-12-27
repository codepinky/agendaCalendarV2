import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`loading-spinner loading-spinner-${size} ${className}`} role="status" aria-label="Carregando">
      <div className="loading-spinner-circle"></div>
      <div className="loading-spinner-circle"></div>
      <div className="loading-spinner-circle"></div>
    </div>
  );
}

export default LoadingSpinner;





