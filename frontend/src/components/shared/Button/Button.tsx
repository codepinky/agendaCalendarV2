import { Button as BootstrapButton } from 'react-bootstrap';
import './Button.css';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  size?: 'sm' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
}

function Button({ variant = 'primary', size, children, onClick, type = 'button', disabled = false, className = '' }: ButtonProps) {
  return (
    <BootstrapButton
      variant={variant}
      size={size}
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`shared-button ${className}`}
    >
      {children}
    </BootstrapButton>
  );
}

export default Button;





