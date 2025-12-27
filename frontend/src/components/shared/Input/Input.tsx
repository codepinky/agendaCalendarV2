import { Form } from 'react-bootstrap';
import { useEffect, useRef } from 'react';
import './Input.css';

interface InputProps {
  type?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  className?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  helpText?: string;
  disabled?: boolean;
  as?: 'input' | 'textarea';
  rows?: number;
}

function Input({ 
  type = 'text', 
  label, 
  placeholder, 
  value, 
  onChange, 
  onBlur,
  error, 
  required = false,
  className = '',
  min,
  max,
  maxLength,
  helpText,
  disabled = false,
  as = 'input',
  rows
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const controlProps: any = {
    as,
    placeholder,
    value,
    onChange,
    onBlur,
    isInvalid: !!error,
    disabled,
    maxLength,
  };

  if (as === 'textarea') {
    controlProps.rows = rows || 4;
  } else {
    controlProps.type = type;
    // NÃO passar min/max nas props - vamos gerenciar diretamente no DOM via useEffect
    // Isso evita que o React Bootstrap mantenha valores antigos
  }

  // Callback ref para garantir acesso ao elemento nativo após montagem
  const setInputRef = (element: HTMLInputElement | null) => {
    inputRef.current = element;
    
    // Atualizar atributos imediatamente quando o elemento for montado/atualizado
    if (element && type === 'time') {
      // Sempre remover primeiro para limpar valores antigos
      element.removeAttribute('min');
      element.removeAttribute('max');
      
      // Adicionar min apenas se for definido e válido
      if (min !== undefined && min !== null && min !== '') {
        element.setAttribute('min', min);
      }
      
      // Adicionar max apenas se for definido e válido
      if (max !== undefined && max !== null && max !== '') {
        element.setAttribute('max', max);
      }
    }
  };

  // Atualizar atributos quando min/max mudarem
  useEffect(() => {
    if (inputRef.current && type === 'time') {
      // Sempre remover primeiro para limpar valores antigos
      inputRef.current.removeAttribute('min');
      inputRef.current.removeAttribute('max');
      
      // Adicionar min apenas se for definido e válido
      if (min !== undefined && min !== null && min !== '') {
        inputRef.current.setAttribute('min', min);
      }
      
      // Adicionar max apenas se for definido e válido
      if (max !== undefined && max !== null && max !== '') {
        inputRef.current.setAttribute('max', max);
      }
    }
  }, [min, max, type]);

  return (
    <Form.Group className={`shared-input ${className}`}>
      {label && <Form.Label>{label} {required && <span className="text-danger">*</span>}</Form.Label>}
      <Form.Control {...controlProps} ref={setInputRef} />
      {helpText && !error && <Form.Text className="text-muted">{helpText}</Form.Text>}
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
}

export default Input;



