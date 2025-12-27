import { useState, useEffect } from 'react';
import { Container, Form, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { labels } from '../../locales/pt-BR';
import Button from '../../components/shared/Button/Button';
import Input from '../../components/shared/Input/Input';
import api from '../../services/api';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useDebounce } from '../../hooks/useDebounce';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    licenseCode: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validatingLicense, setValidatingLicense] = useState(false);

  // DEBOUNCE: Valores debounced para validações
  // License code: 2000ms (2s) - dá tempo suficiente para digitar o código completo
  // Validação também acontece onBlur (quando sair do campo)
  const debouncedLicenseCode = useDebounce(formData.licenseCode, 2000);
  const debouncedEmail = useDebounce(formData.email, 300);

  // Validação em tempo real (sem debounce para feedback imediato de formato)
  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (!value) {
          newErrors.email = labels.errorRequired;
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            newErrors.email = labels.errorInvalidEmail;
          } else {
            delete newErrors.email;
          }
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = labels.errorRequired;
        } else if (value.length < 6) {
          newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
        } else {
          delete newErrors.password;
        }
        // Validar confirmPassword se já foi preenchido
        if (formData.confirmPassword) {
          if (value !== formData.confirmPassword) {
            newErrors.confirmPassword = labels.errorPasswordMismatch;
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = labels.errorRequired;
        } else if (value !== formData.password) {
          newErrors.confirmPassword = labels.errorPasswordMismatch;
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case 'name':
        if (!value) {
          newErrors.name = labels.errorRequired;
        } else {
          delete newErrors.name;
        }
        break;
      case 'licenseCode':
        if (!value) {
          newErrors.licenseCode = labels.errorRequired;
        } else {
          delete newErrors.licenseCode;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, [field]: value });
    validateField(field, value);
  };

  const validateLicense = async (code: string) => {
    if (!code || code.length < 8) {
      return false;
    }

    setValidatingLicense(true);
    try {
      const response = await api.post('/licenses/validate', {
        code: code,
      });
      
      if (!response.data.valid) {
        setErrors((prev) => ({
          ...prev,
          licenseCode: response.data.error || labels.errorInvalidLicense,
        }));
        return false;
      }
      
      // Limpar erro se license for válida
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.licenseCode;
        return newErrors;
      });
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || labels.errorInvalidLicense;
      setErrors((prev) => ({
        ...prev,
        licenseCode: errorMessage,
      }));
      return false;
    } finally {
      setValidatingLicense(false);
    }
  };

  // DEBOUNCE: Validar license code após debounce (2000ms - 2 segundos)
  // Só valida via debounce se o código tiver 8+ caracteres E não estiver validando no momento
  useEffect(() => {
    // Só validar se não estiver validando no momento (evita múltiplas validações)
    if (debouncedLicenseCode && debouncedLicenseCode.length >= 8 && !validatingLicense) {
      validateLicense(debouncedLicenseCode);
    } else if (debouncedLicenseCode && debouncedLicenseCode.length < 8) {
      // Limpar erro se código for muito curto
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.licenseCode;
        return newErrors;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLicenseCode]);

  // Handler para validar quando sair do campo (onBlur)
  const handleLicenseBlur = async () => {
    if (formData.licenseCode && formData.licenseCode.length >= 8 && !validatingLicense) {
      await validateLicense(formData.licenseCode);
    }
  };

  // DEBOUNCE: Validar email após debounce (300ms)
  useEffect(() => {
    if (debouncedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(debouncedEmail)) {
        setErrors((prev) => ({
          ...prev,
          email: labels.errorInvalidEmail,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    }
  }, [debouncedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrors({});

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.licenseCode) newErrors.licenseCode = labels.errorRequired;
    if (!formData.name) newErrors.name = labels.errorRequired;
    if (!formData.email) newErrors.email = labels.errorRequired;
    if (!formData.password) newErrors.password = labels.errorRequired;
    if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = labels.errorPasswordMismatch;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ email: labels.errorInvalidEmail });
      return;
    }

    // Validate license first (usar função sem debounce para submit)
    const isValid = await validateLicense(formData.licenseCode);
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', {
        licenseCode: formData.licenseCode,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Sign in with custom token
      await signInWithCustomToken(auth, response.data.token);
      
      // Store token
      localStorage.setItem('authToken', response.data.token);
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="register-container">
      <div className="register-card">
        <h1 className="register-title">{labels.registerTitle}</h1>
        
        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Input
            label={labels.licenseCode}
            placeholder={labels.licenseCodePlaceholder}
            value={formData.licenseCode}
            onChange={handleChange('licenseCode')}
            onBlur={handleLicenseBlur}
            error={errors.licenseCode}
            required
            disabled={validatingLicense}
          />

          <Input
            label={labels.name}
            placeholder={labels.namePlaceholder}
            value={formData.name}
            onChange={handleChange('name')}
            error={errors.name}
            required
          />

          <Input
            type="email"
            label={labels.email}
            placeholder={labels.emailPlaceholder}
            value={formData.email}
            onChange={handleChange('email')}
            error={errors.email}
            required
          />

          <Input
            type="password"
            label={labels.password}
            placeholder={labels.passwordPlaceholder}
            value={formData.password}
            onChange={handleChange('password')}
            error={errors.password}
            required
          />

          <Input
            type="password"
            label={labels.confirmPassword}
            placeholder={labels.confirmPasswordPlaceholder}
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={errors.confirmPassword}
            required
          />

          <Button type="submit" disabled={loading}>
            {loading ? labels.loading : labels.registerButton}
          </Button>
        </Form>

        <p className="register-footer">
          {labels.alreadyHaveAccount} <Link to="/login">{labels.loginLink}</Link>
        </p>
      </div>
    </Container>
  );
}

export default Register;
