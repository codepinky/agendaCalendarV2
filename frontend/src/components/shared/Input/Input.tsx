import { Form } from 'react-bootstrap';
import './Input.css';

interface InputProps {
  type?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

function Input({ 
  type = 'text', 
  label, 
  placeholder, 
  value, 
  onChange, 
  error, 
  required = false,
  className = '' 
}: InputProps) {
  return (
    <Form.Group className={`shared-input ${className}`}>
      {label && <Form.Label>{label} {required && <span className="text-danger">*</span>}</Form.Label>}
      <Form.Control
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        isInvalid={!!error}
      />
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
}

export default Input;

