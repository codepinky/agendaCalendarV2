import { useState } from 'react';
import { Container, Form, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { labels } from '../../locales/pt-BR';
import Button from '../../components/shared/Button/Button';
import Input from '../../components/shared/Input/Input';
import api from '../../services/api';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../../services/firebase';
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

  // Validação em tempo real
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

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, [field]: value });
    validateField(field, value);
  };

  const validateLicense = async () => {
    try {
      const response = await api.post('/licenses/validate', {
        code: formData.licenseCode,
      });
      return response.data.valid;
    } catch (err: any) {
      setError(err.response?.data?.error || labels.errorGeneric);
      return false;
    }
  };

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

    // Validate license first
    const isValid = await validateLicense();
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
            error={errors.licenseCode}
            required
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
